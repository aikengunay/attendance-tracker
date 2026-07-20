import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { endSession, startSession } from "@/lib/session/lifecycle";
import { setManualAttendance } from "@/lib/session/override";
import {
  normalizeStudentName,
  parseHeaderDate,
  templateFileForSection,
  exportSectionGradebook,
} from "./gradebook";
import ExcelJS from "exceljs";

describe("gradebook helpers", () => {
  it("parses date headers", () => {
    expect(parseHeaderDate("Wednesday, July 15, 2026")).toBe("2026-07-15");
    expect(parseHeaderDate("\tThursday, July 31, 2025")).toBe("2025-07-31");
  });

  it("maps section codes to templates", () => {
    expect(path.basename(templateFileForSection("INF231MWA"))).toBe(
      "attendance-inf231.xlsx",
    );
    expect(path.basename(templateFileForSection("INF232MWA"))).toBe(
      "attendance-inf232.xlsx",
    );
  });

  it("normalizes names", () => {
    expect(normalizeStudentName("  Abonita,  John  ")).toBe("ABONITA, JOHN");
  });
});

describe("exportSectionGradebook", () => {
  let sectionId: string;

  beforeAll(async () => {
    // Prefer real INF231 import if present; else skip-like create
    let section = await prisma.section.findUnique({
      where: { code: "INF231MWA" },
      include: { templates: true, students: true },
    });
    if (!section) {
      const { parseClasslistBuffer } = await import("@/lib/import/classlist");
      const { commitClasslist } = await import("@/lib/import/commit");
      const { readFileSync } = await import("node:fs");
      const buf = readFileSync("fixtures/classlists/inf231.xls");
      const parsed = parseClasslistBuffer(buf);
      const result = await commitClasslist(prisma, parsed);
      section = await prisma.section.findUniqueOrThrow({
        where: { id: result.sectionId },
        include: { templates: true, students: true },
      });
    }
    sectionId = section.id;

    const open = await prisma.session.findMany({
      where: { status: "open", meeting: { sectionId } },
    });
    for (const s of open) await endSession(prisma, s.id);

    const started = await startSession(prisma, {
      sectionId,
      templateId: section.templates[0]?.id,
      date: "2026-07-18",
      t0Mode: "now",
    });

    const student = section.students.find((s) =>
      s.name.toUpperCase().includes("ABONITA"),
    );
    if (student) {
      await setManualAttendance(prisma, {
        sessionId: started.session.id,
        studentKey: student.studentId,
        code: 2,
        note: "export test",
      });
    }
    await endSession(prisma, started.session.id);
  });

  it("fills the INF231 gradebook template for an opened date", async () => {
    const result = await exportSectionGradebook(prisma, sectionId);
    expect(result.templateUsed).toBe("attendance-inf231.xlsx");
    expect(result.writtenMarks).toBeGreaterThan(0);

    const wb = new ExcelJS.Workbook();
    // exceljs load from buffer
    // @ts-expect-error Buffer is valid
    await wb.xlsx.load(result.buffer);
    const mid = wb.getWorksheet("midterms");
    expect(mid).toBeTruthy();

    // Find ABONITA row and July 18 column (D = Saturday week 1)
    let abonitaRow = 0;
    mid!.eachRow((row, rowNumber) => {
      if (rowNumber < 3) return;
      const name = String(row.getCell(2).value ?? "");
      if (normalizeStudentName(name).includes("ABONITA")) abonitaRow = rowNumber;
    });
    expect(abonitaRow).toBeGreaterThan(0);
    expect(mid!.getRow(abonitaRow).getCell(4).value).toBe(2);
  });
});
