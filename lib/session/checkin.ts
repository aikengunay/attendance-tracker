import type { PrismaClient } from "@/lib/generated/prisma/client";
import { scoreCheckIn } from "@/lib/scoring";

export type CheckInInput = {
  studentId: string;
  sectionCode: string;
  token: string;
};

export type CheckInSuccess = {
  code: 1 | 2 | 3 | 4;
  name: string;
  studentId: string;
  sectionCode: string;
  checkedInAt: string;
  label: string;
};

const CODE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Present / on time (or under 15 min late)",
  2: "Late 15–30 min",
  3: "Late 30–60 min",
  4: "Late 60+ min",
};

export async function performCheckIn(
  prisma: PrismaClient,
  input: CheckInInput,
): Promise<CheckInSuccess> {
  const studentId = input.studentId.trim();
  const sectionCode = input.sectionCode.trim().toUpperCase();
  const token = input.token.trim();

  if (!studentId || !sectionCode || !token) {
    throw Object.assign(new Error("studentId, sectionCode, and token are required"), {
      code: "BAD_REQUEST",
    });
  }

  const now = new Date();
  const qr = await prisma.qrToken.findUnique({
    where: { token },
    include: {
      session: {
        include: {
          meeting: { include: { section: true } },
        },
      },
    },
  });

  if (!qr || qr.expiresAt <= now) {
    throw Object.assign(new Error("QR token expired or invalid"), { code: "TOKEN_EXPIRED" });
  }
  if (qr.session.status !== "open") {
    throw Object.assign(new Error("Session is closed"), { code: "SESSION_CLOSED" });
  }
  if (qr.session.meeting.section.code.toUpperCase() !== sectionCode) {
    throw Object.assign(new Error("Token is for a different section"), {
      code: "NOT_IN_SECTION",
    });
  }

  const student = await prisma.student.findFirst({
    where: {
      sectionId: qr.session.meeting.sectionId,
      studentId,
      active: true,
    },
  });
  if (!student) {
    throw Object.assign(new Error("Student not in this section"), { code: "NOT_IN_SECTION" });
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: { sessionId: qr.sessionId, studentId: student.id },
    },
  });
  if (existing) {
    throw Object.assign(new Error("Already checked in for this session"), {
      code: "ALREADY_CHECKED_IN",
      codeMark: existing.code,
    });
  }

  const score = scoreCheckIn({
    t0: qr.session.t0,
    checkedInAt: now,
    earlyMinutes: qr.session.earlyMinutes,
  });
  if (score === "too_early") {
    throw Object.assign(new Error("Too early to check in"), { code: "TOO_EARLY" });
  }

  await prisma.attendance.create({
    data: {
      sessionId: qr.sessionId,
      studentId: student.id,
      code: score,
      source: "qr",
      checkedInAt: now,
    },
  });

  return {
    code: score,
    name: student.name,
    studentId: student.studentId,
    sectionCode: qr.session.meeting.section.code,
    checkedInAt: now.toISOString(),
    label: CODE_LABELS[score],
  };
}

export async function lookupStudent(
  prisma: PrismaClient,
  sectionCode: string,
  studentId: string,
) {
  const section = await prisma.section.findUnique({
    where: { code: sectionCode.trim().toUpperCase() },
  });
  if (!section) return null;

  return prisma.student.findFirst({
    where: {
      sectionId: section.id,
      studentId: studentId.trim(),
      active: true,
    },
    select: {
      studentId: true,
      name: true,
      section: { select: { code: true, subjectName: true } },
    },
  });
}
