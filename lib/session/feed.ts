import type { PrismaClient } from "@/lib/generated/prisma/client";

export async function getSessionFeed(prisma: PrismaClient, sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      meeting: { include: { section: true } },
      attendances: {
        include: { student: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!session) {
    throw Object.assign(new Error("Session not found"), { code: "NOT_FOUND" });
  }

  const students = await prisma.student.findMany({
    where: { sectionId: session.meeting.sectionId, active: true },
    orderBy: { name: "asc" },
  });

  const byStudentId = new Map(
    session.attendances.map((a) => [a.studentId, a]),
  );

  const roster = students.map((s) => {
    const mark = byStudentId.get(s.id);
    return {
      id: s.id,
      studentId: s.studentId,
      name: s.name,
      code: mark?.code ?? null,
      source: mark?.source ?? null,
      checkedInAt: mark?.checkedInAt?.toISOString() ?? null,
      note: mark?.note ?? null,
      updatedAt: mark?.updatedAt?.toISOString() ?? null,
    };
  });

  const marked = roster.filter((r) => r.code !== null);
  const checkedIn = roster.filter((r) => r.code !== null && r.code > 0);
  const unmarked = roster.filter((r) => r.code === null);

  const recent = session.attendances
    .filter((a) => a.source === "qr" || a.source === "manual")
    .slice(0, 15)
    .map((a) => ({
      studentId: a.student.studentId,
      name: a.student.name,
      code: a.code,
      source: a.source,
      checkedInAt: a.checkedInAt?.toISOString() ?? null,
      note: a.note,
    }));

  const latest =
    recent.find((r) => r.source === "qr" || r.source === "manual") ?? null;

  return {
    sessionId: session.id,
    status: session.status,
    sectionCode: session.meeting.section.code,
    sectionId: session.meeting.sectionId,
    t0: session.t0.toISOString(),
    counts: {
      roster: students.length,
      marked: marked.length,
      checkedIn: checkedIn.length,
      unmarked: unmarked.length,
    },
    latest,
    recent,
    roster,
  };
}
