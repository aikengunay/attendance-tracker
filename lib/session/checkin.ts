import type { PrismaClient } from "@/lib/generated/prisma/client";
import { studentStatusFor } from "@/lib/attendance-copy";
import { scoreCheckIn } from "@/lib/scoring";
import { classWindowForMeeting, personalTokenTtlSeconds } from "@/lib/time";
import { randomBytes } from "node:crypto";

export type CheckInSuccess = {
  code: 1 | 2 | 3 | 4;
  name: string;
  studentId: string;
  sectionCode: string;
  checkedInAt: string;
  label: string;
  sessionId: string;
};

function labelFor(code: 1 | 2 | 3 | 4): string {
  return studentStatusFor(code).detail;
}

/** ~43 chars — keeps QR module density similar to the old join URL payload. */
export function newCheckInTokenValue(): string {
  return randomBytes(32).toString("base64url");
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
      id: true,
      studentId: true,
      name: true,
      section: {
        select: {
          id: true,
          code: true,
          subjectName: true,
          termLabel: true,
        },
      },
    },
  });
}

export type IssuePersonalTokenResult = {
  token: string;
  expiresAt: string;
  sessionId: string;
  name: string;
  studentId: string;
  sectionCode: string;
  subjectName: string;
  termLabel: string;
  meetingStartAt: string;
  meetingEndAt: string;
  room: string | null;
};

export type AlreadyCheckedInReceipt = {
  code: 1 | 2 | 3 | 4;
  label: string;
  name: string;
  studentId: string;
  sectionCode: string;
};

/** If student already has code 1–4 on the section's open session, return receipt fields. */
export async function getOpenSessionCheckInReceipt(
  prisma: PrismaClient,
  sectionCode: string,
  studentIdRaw: string,
): Promise<AlreadyCheckedInReceipt | null> {
  const student = await lookupStudent(prisma, sectionCode, studentIdRaw);
  if (!student) return null;

  const session = await prisma.session.findFirst({
    where: {
      status: "open",
      meeting: { sectionId: student.section.id },
    },
  });
  if (!session) return null;

  const attendance = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
  });
  if (!attendance || attendance.code <= 0) return null;

  const code = attendance.code as 1 | 2 | 3 | 4;
  return {
    code,
    label: labelFor(code),
    name: student.name,
    studentId: student.studentId,
    sectionCode: student.section.code,
  };
}

/** Issue (or refresh) a personal QR token for the open session of this section. */
export async function issuePersonalToken(
  prisma: PrismaClient,
  sectionCode: string,
  studentIdRaw: string,
): Promise<IssuePersonalTokenResult> {
  const student = await lookupStudent(prisma, sectionCode, studentIdRaw);
  if (!student) {
    throw Object.assign(new Error("Student not found in section"), {
      code: "NOT_IN_SECTION",
    });
  }

  const session = await prisma.session.findFirst({
    where: {
      status: "open",
      meeting: { sectionId: student.section.id },
    },
    include: {
      meeting: {
        include: { template: true, section: true },
      },
    },
  });
  if (!session) {
    throw Object.assign(new Error("No open session for this section"), {
      code: "SESSION_CLOSED",
    });
  }

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
  });
  if (existingAttendance && existingAttendance.code > 0) {
    const code = existingAttendance.code as 1 | 2 | 3 | 4;
    throw Object.assign(new Error("Already checked in for this session"), {
      code: "ALREADY_CHECKED_IN",
      codeMark: code,
      name: student.name,
      studentId: student.studentId,
      sectionCode: student.section.code,
      label: labelFor(code),
    });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + personalTokenTtlSeconds() * 1000);
  const token = newCheckInTokenValue();

  // Invalidate prior unused tokens for this student/session
  await prisma.checkInToken.deleteMany({
    where: {
      sessionId: session.id,
      studentId: student.id,
      consumedAt: null,
    },
  });

  await prisma.checkInToken.create({
    data: {
      sessionId: session.id,
      studentId: student.id,
      token,
      expiresAt,
    },
  });

  const room =
    session.meeting.template?.room ??
    session.meeting.template?.roomType ??
    session.meeting.title;

  const window = classWindowForMeeting(session.meeting);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    sessionId: session.id,
    name: student.name,
    studentId: student.studentId,
    sectionCode: student.section.code,
    subjectName: student.section.subjectName,
    termLabel: student.section.termLabel,
    meetingStartAt: window.start.toISOString(),
    meetingEndAt: window.end.toISOString(),
    room,
  };
}

export async function getPersonalCheckInStatus(
  prisma: PrismaClient,
  token: string,
) {
  const row = await prisma.checkInToken.findUnique({
    where: { token: token.trim() },
    include: {
      student: true,
      session: {
        include: {
          meeting: { include: { section: true } },
        },
      },
    },
  });
  if (!row) {
    return { checkedIn: false as const, valid: false as const };
  }

  const attendance = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: row.sessionId,
        studentId: row.studentId,
      },
    },
  });
  if (attendance && attendance.code > 0) {
    const code = attendance.code as 1 | 2 | 3 | 4;
    return {
      checkedIn: true as const,
      valid: true as const,
      code,
      label: labelFor(code),
      name: row.student.name,
      studentId: row.student.studentId,
      sectionCode: row.session.meeting.section.code,
    };
  }

  const expired = row.expiresAt <= new Date();
  return {
    checkedIn: false as const,
    valid: !expired && !row.consumedAt,
    expired,
  };
}

/** Teacher station: scan personal token and mark attendance. */
export async function performTeacherScan(
  prisma: PrismaClient,
  sessionId: string,
  tokenRaw: string,
): Promise<CheckInSuccess> {
  const token = tokenRaw.trim();
  if (!token) {
    throw Object.assign(new Error("token is required"), { code: "BAD_REQUEST" });
  }

  const now = new Date();
  const row = await prisma.checkInToken.findUnique({
    where: { token },
    include: {
      student: true,
      session: {
        include: {
          meeting: { include: { section: true } },
        },
      },
    },
  });

  if (!row || row.expiresAt <= now) {
    throw Object.assign(new Error("QR token expired or invalid"), {
      code: "TOKEN_EXPIRED",
    });
  }
  if (row.sessionId !== sessionId) {
    throw Object.assign(new Error("Token is for a different session"), {
      code: "INVALID_TOKEN",
    });
  }
  if (row.session.status !== "open") {
    throw Object.assign(new Error("Session is closed"), {
      code: "SESSION_CLOSED",
    });
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: row.sessionId,
        studentId: row.studentId,
      },
    },
  });
  if (existing && existing.code > 0) {
    throw Object.assign(new Error("Already checked in for this session"), {
      code: "ALREADY_CHECKED_IN",
      codeMark: existing.code,
    });
  }

  const score = scoreCheckIn({
    t0: row.session.t0,
    checkedInAt: now,
    earlyMinutes: row.session.earlyMinutes,
  });
  if (score === "too_early") {
    throw Object.assign(new Error("Too early to check in"), { code: "TOO_EARLY" });
  }

  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.attendance.update({
        where: { id: existing.id },
        data: {
          code: score,
          source: "teacher_scan",
          checkedInAt: now,
        },
      });
    } else {
      await tx.attendance.create({
        data: {
          sessionId: row.sessionId,
          studentId: row.studentId,
          code: score,
          source: "teacher_scan",
          checkedInAt: now,
        },
      });
    }
    await tx.checkInToken.update({
      where: { id: row.id },
      data: { consumedAt: now },
    });
  });

  return {
    code: score,
    name: row.student.name,
    studentId: row.student.studentId,
    sectionCode: row.session.meeting.section.code,
    checkedInAt: now.toISOString(),
    label: labelFor(score),
    sessionId: row.sessionId,
  };
}
