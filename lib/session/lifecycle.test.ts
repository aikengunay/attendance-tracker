import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { scoreCheckIn } from "@/lib/scoring";
import { performCheckIn } from "./checkin";
import { endSession, ensureCurrentQrToken, startSession } from "./lifecycle";

describe("session lifecycle", () => {
  let sectionId: string;
  let studentA: { id: string; studentId: string };
  let studentB: { id: string; studentId: string };
  let templateId: string;

  beforeAll(async () => {
    await prisma.section.deleteMany({ where: { code: "TESTM4" } });
    const section = await prisma.section.create({
      data: {
        code: "TESTM4",
        subjectName: "Test Subject",
        termLabel: "Test Term",
        templates: {
          create: {
            dayOfWeek: 3,
            startTime: "13:00",
            endTime: "15:40",
            roomType: "Lec",
            room: "TEST",
          },
        },
        students: {
          create: [
            { studentId: "T-001", name: "ALPHA, ONE", active: true },
            { studentId: "T-002", name: "BETA, TWO", active: true },
          ],
        },
      },
      include: { templates: true, students: { orderBy: { studentId: "asc" } } },
    });
    sectionId = section.id;
    templateId = section.templates[0]!.id;
    studentA = section.students[0]!;
    studentB = section.students[1]!;
  });

  it("starts session, scores check-in, ends with auto-absent 0", async () => {
    const started = await startSession(prisma, {
      sectionId,
      templateId,
      t0Mode: "now",
    });
    expect(started.session.status).toBe("open");

    const qr = await ensureCurrentQrToken(prisma, started.session.id);
    const result = await performCheckIn(prisma, {
      studentId: studentA.studentId,
      sectionCode: "TESTM4",
      token: qr.token,
    });
    expect(result.code).toBe(1);

    const t0 = started.session.t0;
    expect(
      scoreCheckIn({
        t0,
        checkedInAt: new Date(t0.getTime() + 20 * 60_000),
      }),
    ).toBe(2);

    const ended = await endSession(prisma, started.session.id);
    expect(ended.markedAbsent).toBe(1);

    const absent = await prisma.attendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: started.session.id,
          studentId: studentB.id,
        },
      },
    });
    expect(absent?.code).toBe(0);
    expect(absent?.source).toBe("auto");
  });
});
