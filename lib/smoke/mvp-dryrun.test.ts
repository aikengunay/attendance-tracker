/**
 * M7 dry-run: INF231 + INF232 import → session → check-in/override → end → export.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { parseClasslistBuffer } from "@/lib/import/classlist";
import { commitClasslist } from "@/lib/import/commit";
import { performCheckIn } from "@/lib/session/checkin";
import {
  endSession,
  ensureCurrentQrToken,
  startSession,
} from "@/lib/session/lifecycle";
import { setManualAttendance } from "@/lib/session/override";
import { getSessionFeed } from "@/lib/session/feed";
import {
  exportSectionGradebook,
  normalizeStudentName,
} from "@/lib/export/gradebook";
import { scoreCheckIn } from "@/lib/scoring";

const fixtures = path.join(process.cwd(), "fixtures/classlists");

async function closeOpenSessions(sectionId: string) {
  const open = await prisma.session.findMany({
    where: { status: "open", meeting: { sectionId } },
  });
  for (const s of open) await endSession(prisma, s.id);
}

async function importSection(file: string) {
  const parsed = parseClasslistBuffer(
    readFileSync(path.join(fixtures, file)),
  );
  const result = await commitClasslist(prisma, parsed);
  const section = await prisma.section.findUniqueOrThrow({
    where: { id: result.sectionId },
    include: {
      templates: { orderBy: { startTime: "asc" } },
      students: { orderBy: { name: "asc" } },
    },
  });
  return { parsed, section };
}

describe("M7 dry-run INF231 + INF232", () => {
  beforeAll(async () => {
    // Clean prior dry-run residue for these codes (keep other test sections)
    await prisma.section.deleteMany({
      where: { code: { in: ["INF231MWA", "INF232MWA"] } },
    });
  });

  it("INF231: import, staggered codes, auto-absent, gradebook export", async () => {
    const { parsed, section } = await importSection("inf231.xls");
    expect(parsed.sectionCode).toBe("INF231MWA");
    expect(section.students.length).toBe(40);
    expect(section.templates.length).toBe(2);

    await closeOpenSessions(section.id);

    const started = await startSession(prisma, {
      sectionId: section.id,
      templateId: section.templates[0]!.id,
      date: "2026-07-22", // Wednesday week 2
      t0Mode: "now",
    });

    const qr = await ensureCurrentQrToken(prisma, started.session.id);
    const s1 = section.students[0]!;
    const s2 = section.students[1]!;
    const s3 = section.students[2]!;
    const s4 = section.students[3]!;

    const checkin = await performCheckIn(prisma, {
      studentId: s1.studentId,
      sectionCode: "INF231MWA",
      token: qr.token,
    });
    expect(checkin.code).toBe(1);

    await setManualAttendance(prisma, {
      sessionId: started.session.id,
      studentKey: s2.studentId,
      code: 2,
      note: "dry-run late",
    });
    await setManualAttendance(prisma, {
      sessionId: started.session.id,
      studentKey: s3.studentId,
      code: 3,
    });
    await setManualAttendance(prisma, {
      sessionId: started.session.id,
      studentKey: s4.studentId,
      code: 4,
    });

    // Scoring windows still consistent
    const t0 = started.session.t0;
    expect(scoreCheckIn({ t0, checkedInAt: new Date(t0.getTime() + 20 * 60_000) })).toBe(2);
    expect(scoreCheckIn({ t0, checkedInAt: new Date(t0.getTime() + 45 * 60_000) })).toBe(3);
    expect(scoreCheckIn({ t0, checkedInAt: new Date(t0.getTime() + 90 * 60_000) })).toBe(4);

    const feed = await getSessionFeed(prisma, started.session.id);
    expect(feed.counts.checkedIn).toBe(4);
    expect(feed.counts.unmarked).toBe(36);
    expect(feed.latest?.name).toBeTruthy();

    const ended = await endSession(prisma, started.session.id);
    expect(ended.markedAbsent).toBe(36);

    // Unopened date must not invent zeros in export — only 2026-07-22 column filled
    const exported = await exportSectionGradebook(prisma, section.id);
    expect(exported.templateUsed).toBe("attendance-inf231.xlsx");
    expect(exported.writtenMarks).toBe(40);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(exported.buffer);
    const mid = wb.getWorksheet("midterms")!;
    // July 22 = column E (week 2 Wednesday)
    let rowS1 = 0;
    mid.eachRow((row, n) => {
      if (n < 3) return;
      if (
        normalizeStudentName(String(row.getCell(2).value ?? "")) ===
        normalizeStudentName(s1.name)
      ) {
        rowS1 = n;
      }
    });
    expect(rowS1).toBeGreaterThan(0);
    expect(mid.getRow(rowS1).getCell(5).value).toBe(1);
    // Unopened week-1 Wednesday (col C) stays blank
    expect(mid.getRow(rowS1).getCell(3).value).toBeNull();
  });

  it("INF232: import, check-in, end, export", async () => {
    const { parsed, section } = await importSection("inf232.xls");
    expect(parsed.sectionCode).toBe("INF232MWA");
    expect(section.students.length).toBe(22);

    await closeOpenSessions(section.id);

    const started = await startSession(prisma, {
      sectionId: section.id,
      templateId: section.templates[0]!.id,
      date: "2026-07-18", // Saturday
      t0Mode: "now",
    });

    const qr = await ensureCurrentQrToken(prisma, started.session.id);
    const student = section.students[0]!;
    const result = await performCheckIn(prisma, {
      studentId: student.studentId,
      sectionCode: "INF232MWA",
      token: qr.token,
    });
    expect([1, 2, 3, 4]).toContain(result.code);

    // Reject duplicate
    await expect(
      performCheckIn(prisma, {
        studentId: student.studentId,
        sectionCode: "INF232MWA",
        token: qr.token,
      }),
    ).rejects.toMatchObject({ code: "ALREADY_CHECKED_IN" });

    // Wrong section token rejection path: INF231 token against INF232 student
    // (use current token with wrong section code)
    await expect(
      performCheckIn(prisma, {
        studentId: student.studentId,
        sectionCode: "INF231MWA",
        token: qr.token,
      }),
    ).rejects.toMatchObject({ code: "NOT_IN_SECTION" });

    const ended = await endSession(prisma, started.session.id);
    expect(ended.markedAbsent).toBe(21);

    const exported = await exportSectionGradebook(prisma, section.id);
    expect(exported.templateUsed).toBe("attendance-inf232.xlsx");
    expect(exported.writtenMarks).toBe(22);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(exported.buffer);
    expect(wb.getWorksheet("midterms")).toBeTruthy();
    expect(wb.getWorksheet("finals")).toBeTruthy();
    expect(wb.getWorksheet("all")).toBeTruthy();
    expect(wb.getWorksheet("summary")).toBeTruthy();
  });

  it("AP runbook env defaults are sane", () => {
    expect(Number(process.env.QR_ROTATE_SECONDS ?? 20)).toBeGreaterThanOrEqual(5);
    expect(Number(process.env.EARLY_CHECKIN_MINUTES ?? 15)).toBeGreaterThanOrEqual(0);
    expect(process.env.TEACHER_PIN || "1234").toBeTruthy();
  });
});
