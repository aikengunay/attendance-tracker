import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { endSession, startSession } from "./lifecycle";
import { setManualAttendance } from "./override";
import { getSessionFeed } from "./feed";

describe("manual attendance override", () => {
  let sectionId: string;
  let studentId: string;
  let registrarId: string;

  beforeAll(async () => {
    await prisma.section.deleteMany({ where: { code: "TESTM5" } });
    const section = await prisma.section.create({
      data: {
        code: "TESTM5",
        subjectName: "Override Test",
        termLabel: "Test",
        templates: {
          create: {
            dayOfWeek: 6,
            startTime: "13:00",
            endTime: "15:00",
            roomType: "Lab",
          },
        },
        students: {
          create: [{ studentId: "M5-001", name: "MANUAL, STUDENT", active: true }],
        },
      },
      include: { students: true, templates: true },
    });
    sectionId = section.id;
    studentId = section.students[0]!.id;
    registrarId = section.students[0]!.studentId;
  });

  it("marks manual code and appears in feed", async () => {
    const open = await prisma.session.findMany({
      where: { status: "open", meeting: { sectionId } },
    });
    for (const s of open) await endSession(prisma, s.id);

    const started = await startSession(prisma, {
      sectionId,
      templateId: (
        await prisma.meetingTemplate.findFirstOrThrow({ where: { sectionId } })
      ).id,
      t0Mode: "now",
    });

    const mark = await setManualAttendance(prisma, {
      sessionId: started.session.id,
      studentKey: registrarId,
      code: 2,
      note: "no phone",
    });
    expect(mark.code).toBe(2);
    expect(mark.source).toBe("manual");
    expect(mark.note).toBe("no phone");

    const feed = await getSessionFeed(prisma, started.session.id);
    expect(feed.counts.checkedIn).toBe(1);
    expect(feed.counts.unmarked).toBe(0);
    expect(feed.roster[0]?.code).toBe(2);
    expect(feed.latest?.name).toBe("MANUAL, STUDENT");

    // Override again by internal id
    const again = await setManualAttendance(prisma, {
      sessionId: started.session.id,
      studentKey: studentId,
      code: 0,
      note: "left early / absent",
    });
    expect(again.code).toBe(0);

    await endSession(prisma, started.session.id);
  });
});
