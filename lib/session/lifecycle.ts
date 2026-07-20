import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  earlyCheckInMinutes,
  manilaDateString,
  manilaDateTime,
  qrRotateSeconds,
} from "@/lib/time";

export type StartSessionInput = {
  sectionId: string;
  templateId?: string | null;
  date?: string | null;
  t0Mode: "scheduled" | "now";
  title?: string | null;
};

export function newQrTokenValue(): string {
  return randomBytes(6).toString("base64url");
}

export async function startSession(prisma: PrismaClient, input: StartSessionInput) {
  const section = await prisma.section.findUnique({
    where: { id: input.sectionId },
    include: { templates: true },
  });
  if (!section) throw Object.assign(new Error("Section not found"), { code: "NOT_FOUND" });

  const openExisting = await prisma.session.findFirst({
    where: {
      status: "open",
      meeting: { sectionId: section.id },
    },
    include: { meeting: true },
  });
  if (openExisting) {
    throw Object.assign(new Error("Section already has an open session"), {
      code: "SESSION_ALREADY_OPEN",
      sessionId: openExisting.id,
    });
  }

  const dateYmd = input.date?.trim() || manilaDateString();
  const template = input.templateId
    ? section.templates.find((t) => t.id === input.templateId)
    : section.templates[0] ?? null;

  if (input.templateId && !template) {
    throw Object.assign(new Error("Meeting template not found"), { code: "NOT_FOUND" });
  }

  const startTime = template?.startTime ?? "13:00";
  const endTime = template?.endTime ?? "15:40";
  const scheduledStart = manilaDateTime(dateYmd, startTime);
  const scheduledEnd = manilaDateTime(dateYmd, endTime);
  const openedAt = new Date();
  const t0 = input.t0Mode === "now" ? openedAt : scheduledStart;
  const earlyMinutes = earlyCheckInMinutes();

  const meetingDate = manilaDateTime(dateYmd, "00:00");
  const title = input.title ?? template?.roomType ?? template?.label ?? null;

  return prisma.$transaction(async (tx) => {
    const existingMeeting = await tx.meeting.findUnique({
      where: {
        sectionId_date_startAt: {
          sectionId: section.id,
          date: meetingDate,
          startAt: scheduledStart,
        },
      },
      include: { session: true },
    });

    let meetingId: string;

    if (existingMeeting?.session?.status === "open") {
      throw Object.assign(new Error("Section already has an open session"), {
        code: "SESSION_ALREADY_OPEN",
        sessionId: existingMeeting.session.id,
      });
    }

    if (!existingMeeting) {
      const created = await tx.meeting.create({
        data: {
          sectionId: section.id,
          templateId: template?.id ?? null,
          date: meetingDate,
          startAt: scheduledStart,
          endAt: scheduledEnd,
          title,
        },
      });
      meetingId = created.id;
    } else if (!existingMeeting.session) {
      meetingId = existingMeeting.id;
    } else {
      // Prior closed session owns this meeting row — create a new meeting instance.
      const created = await tx.meeting.create({
        data: {
          sectionId: section.id,
          templateId: template?.id ?? null,
          date: meetingDate,
          startAt: openedAt,
          endAt: scheduledEnd,
          title: title ? `${title} (retake)` : "Retake",
        },
      });
      meetingId = created.id;
    }

    const session = await tx.session.create({
      data: {
        meetingId,
        status: "open",
        t0,
        openedAt,
        earlyMinutes,
      },
    });

    const expiresAt = new Date(Date.now() + qrRotateSeconds() * 1000);
    const qr = await tx.qrToken.create({
      data: {
        sessionId: session.id,
        token: newQrTokenValue(),
        expiresAt,
      },
    });

    const meeting = await tx.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    return { session, meeting, section, qr };
  });
}

export async function endSession(prisma: PrismaClient, sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      meeting: { include: { section: { include: { students: { where: { active: true } } } } } },
      attendances: true,
    },
  });
  if (!session) throw Object.assign(new Error("Session not found"), { code: "NOT_FOUND" });
  if (session.status === "closed" && session.autoAbsentDone) {
    return { session, markedAbsent: 0 };
  }

  const markedIds = new Set(session.attendances.map((a) => a.studentId));
  const missing = session.meeting.section.students.filter((s) => !markedIds.has(s.id));
  const closedAt = new Date();

  await prisma.$transaction(async (tx) => {
    if (missing.length > 0) {
      await tx.attendance.createMany({
        data: missing.map((s) => ({
          sessionId: session.id,
          studentId: s.id,
          code: 0,
          source: "auto" as const,
          checkedInAt: null,
        })),
      });
    }
    await tx.session.update({
      where: { id: session.id },
      data: {
        status: "closed",
        closedAt,
        autoAbsentDone: true,
      },
    });
  });

  const updated = await prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
  return { session: updated, markedAbsent: missing.length };
}

export async function ensureCurrentQrToken(
  prisma: PrismaClient,
  sessionId: string,
) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw Object.assign(new Error("Session not found"), { code: "NOT_FOUND" });
  if (session.status !== "open") {
    throw Object.assign(new Error("Session is closed"), { code: "SESSION_CLOSED" });
  }

  const now = new Date();
  const current = await prisma.qrToken.findFirst({
    where: { sessionId, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
  if (current) return current;

  return prisma.qrToken.create({
    data: {
      sessionId,
      token: newQrTokenValue(),
      expiresAt: new Date(Date.now() + qrRotateSeconds() * 1000),
    },
  });
}
