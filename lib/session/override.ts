import type { PrismaClient } from "@/lib/generated/prisma/client";

export async function setManualAttendance(
  prisma: PrismaClient,
  input: {
    sessionId: string;
    /** Prisma Student.id (cuid) or registrar Student ID */
    studentKey: string;
    code: number;
    note?: string | null;
  },
) {
  if (!Number.isInteger(input.code) || input.code < 0 || input.code > 4) {
    throw Object.assign(new Error("code must be an integer 0–4"), {
      code: "BAD_REQUEST",
    });
  }

  const session = await prisma.session.findUnique({
    where: { id: input.sessionId },
    include: { meeting: true },
  });
  if (!session) {
    throw Object.assign(new Error("Session not found"), { code: "NOT_FOUND" });
  }

  const student = await prisma.student.findFirst({
    where: {
      sectionId: session.meeting.sectionId,
      active: true,
      OR: [{ id: input.studentKey }, { studentId: input.studentKey }],
    },
  });
  if (!student) {
    throw Object.assign(new Error("Student not in this section"), {
      code: "NOT_IN_SECTION",
    });
  }

  const now = new Date();
  const attendance = await prisma.attendance.upsert({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
    create: {
      sessionId: session.id,
      studentId: student.id,
      code: input.code,
      source: "manual",
      checkedInAt: input.code === 0 ? null : now,
      note: input.note?.trim() || null,
    },
    update: {
      code: input.code,
      source: "manual",
      checkedInAt: input.code === 0 ? null : now,
      note: input.note?.trim() || null,
    },
    include: { student: true },
  });

  return {
    id: attendance.id,
    studentId: attendance.student.studentId,
    name: attendance.student.name,
    code: attendance.code,
    source: attendance.source,
    checkedInAt: attendance.checkedInAt?.toISOString() ?? null,
    note: attendance.note,
  };
}
