import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { scoreCheckIn } from "@/lib/scoring";
import { issuePersonalToken, performTeacherScan } from "./checkin";
import { endSession, startSession } from "./lifecycle";

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

  it("starts session, teacher-scans personal QR, ends with auto-absent 0", async () => {
    const started = await startSession(prisma, {
      sectionId,
      templateId,
      t0Mode: "now",
    });
    expect(started.session.status).toBe("open");

    const personal = await issuePersonalToken(
      prisma,
      "TESTM4",
      studentA.studentId,
    );
    const result = await performTeacherScan(
      prisma,
      started.session.id,
      personal.token,
    );
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

  it("retake keeps scheduled class window (not openedAt → afternoon end)", async () => {
    const open = await prisma.session.findFirst({
      where: { status: "open", meeting: { sectionId } },
    });
    if (open) await endSession(prisma, open.id);

    await startSession(prisma, { sectionId, templateId, t0Mode: "now" });
    const first = await prisma.session.findFirstOrThrow({
      where: { status: "open", meeting: { sectionId } },
    });
    await endSession(prisma, first.id);

    const retake = await startSession(prisma, {
      sectionId,
      templateId,
      t0Mode: "now",
    });
    const startHm = retake.meeting.startAt.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const endHm = retake.meeting.endAt.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    expect(startHm).toBe("13:00");
    expect(endHm).toBe("15:40");
    expect(retake.meeting.endAt.getTime()).toBeGreaterThan(
      retake.meeting.startAt.getTime(),
    );

    await endSession(prisma, retake.session.id);
  });
});

