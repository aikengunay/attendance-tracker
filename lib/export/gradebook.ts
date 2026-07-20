import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { manilaDateString } from "@/lib/time";

const DATE_COLS_START = 3; // C
const DATE_COLS_END = 16; // P
const NAME_COL = 2; // B
const DATA_START_ROW = 3;

export function gradebookTemplatesDir(): string {
  return path.join(
    process.cwd(),
    ".cursor/references/complete-attendance-tracker",
  );
}

export function templateFileForSection(sectionCode: string): string {
  const code = sectionCode.toUpperCase();
  const dir = gradebookTemplatesDir();
  if (code.startsWith("INF231")) {
    return path.join(dir, "attendance-inf231.xlsx");
  }
  if (code.startsWith("INF232")) {
    return path.join(dir, "attendance-inf232.xlsx");
  }
  return path.join(dir, "attendance-template.xlsx");
}

export function normalizeStudentName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Parse workbook header like "Wednesday, July 15, 2026" → YYYY-MM-DD */
export function parseHeaderDate(raw: unknown): string | null {
  if (raw == null) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return manilaDateString(raw);
  }
  const text = String(raw).replace(/^\t+/, "").trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  // Header dates are calendar labels in local class timezone (Manila).
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type MarkKey = string; // `${normName}::${ymd}`

function isFormula(value: ExcelJS.CellValue): boolean {
  if (typeof value === "string") return value.startsWith("=");
  if (value && typeof value === "object" && "formula" in value) return true;
  return false;
}

function buildDateColumnMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  const header = sheet.getRow(2);
  for (let col = DATE_COLS_START; col <= DATE_COLS_END; col++) {
    const ymd = parseHeaderDate(header.getCell(col).value);
    if (ymd) map.set(ymd, col);
  }
  return map;
}

function buildNameRowMap(sheet: ExcelJS.Worksheet): Map<string, number> {
  const map = new Map<string, number>();
  const last = sheet.rowCount;
  for (let row = DATA_START_ROW; row <= last; row++) {
    const raw = sheet.getRow(row).getCell(NAME_COL).value;
    if (raw == null) continue;
    if (isFormula(raw)) continue;
    const name = normalizeStudentName(String(raw));
    if (name) map.set(name, row);
  }
  return map;
}

function clearMarkGrid(sheet: ExcelJS.Worksheet) {
  const last = sheet.rowCount;
  for (let row = DATA_START_ROW; row <= last; row++) {
    for (let col = DATE_COLS_START; col <= DATE_COLS_END; col++) {
      const cell = sheet.getRow(row).getCell(col);
      if (isFormula(cell.value)) continue;
      cell.value = null;
    }
  }
}

export type ExportResult = {
  buffer: Buffer;
  filename: string;
  templateUsed: string;
  writtenMarks: number;
  unmatchedStudents: string[];
  unmatchedDates: string[];
};

export async function exportSectionGradebook(
  prisma: PrismaClient,
  sectionId: string,
): Promise<ExportResult> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      students: { where: { active: true }, orderBy: { name: "asc" } },
      meetings: {
        where: { session: { isNot: null } },
        include: {
          session: {
            include: {
              attendances: { include: { student: true } },
            },
          },
        },
        orderBy: { startAt: "asc" },
      },
    },
  });
  if (!section) {
    throw Object.assign(new Error("Section not found"), { code: "NOT_FOUND" });
  }

  const templatePath = templateFileForSection(section.code);
  if (!fs.existsSync(templatePath)) {
    throw Object.assign(new Error(`Template missing: ${templatePath}`), {
      code: "TEMPLATE_MISSING",
    });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const midterms = workbook.getWorksheet("midterms");
  const finals = workbook.getWorksheet("finals");
  if (!midterms || !finals) {
    throw Object.assign(new Error("Template missing midterms/finals sheets"), {
      code: "TEMPLATE_INVALID",
    });
  }

  clearMarkGrid(midterms);
  clearMarkGrid(finals);

  const midDates = buildDateColumnMap(midterms);
  const finalDates = buildDateColumnMap(finals);
  const nameRows = buildNameRowMap(midterms);

  // One code per student per calendar day (latest session wins).
  const marks = new Map<MarkKey, number>();
  const sessionDates = new Set<string>();

  for (const meeting of section.meetings) {
    const session = meeting.session;
    if (!session) continue;
    const ymd = manilaDateString(meeting.startAt);
    sessionDates.add(ymd);
    for (const att of session.attendances) {
      const key = `${normalizeStudentName(att.student.name)}::${ymd}`;
      marks.set(key, att.code);
    }
  }

  let writtenMarks = 0;
  const unmatchedStudents = new Set<string>();
  const unmatchedDates = new Set<string>();

  for (const [key, code] of marks) {
    const [normName, ymd] = key.split("::");
    const row = nameRows.get(normName!);
    if (!row) {
      unmatchedStudents.add(normName!);
      continue;
    }
    let col = midDates.get(ymd!);
    let sheet: ExcelJS.Worksheet | undefined = midterms;
    if (col == null) {
      col = finalDates.get(ymd!);
      sheet = finals;
    }
    if (col == null || !sheet) {
      unmatchedDates.add(ymd!);
      continue;
    }
    sheet.getRow(row).getCell(col).value = code;
    writtenMarks++;
  }

  // Ensure opened session dates with absences still clear→written; already in marks via auto 0.
  // Track dates that had sessions but no column:
  for (const ymd of sessionDates) {
    if (!midDates.has(ymd) && !finalDates.has(ymd)) {
      unmatchedDates.add(ymd);
    }
  }

  for (const student of section.students) {
    const n = normalizeStudentName(student.name);
    if (!nameRows.has(n)) unmatchedStudents.add(student.name);
  }

  if (unmatchedStudents.size > 0 || unmatchedDates.size > 0) {
    let notes = workbook.getWorksheet("_export_notes");
    if (!notes) notes = workbook.addWorksheet("_export_notes");
    notes.spliceRows(1, notes.rowCount);
    notes.getCell(1, 1).value = "Export notes";
    notes.getCell(2, 1).value =
      "Students in app but not found by name in gradebook template:";
    let r = 3;
    for (const name of unmatchedStudents) {
      notes.getCell(r++, 1).value = name;
    }
    r++;
    notes.getCell(r++, 1).value =
      "Session dates with no matching column header in template:";
    for (const d of unmatchedDates) {
      notes.getCell(r++, 1).value = d;
    }
  }

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const stamp = manilaDateString().replace(/-/g, "");
  const filename = `attendance-${section.code}-${stamp}.xlsx`;

  return {
    buffer,
    filename,
    templateUsed: path.basename(templatePath),
    writtenMarks,
    unmatchedStudents: [...unmatchedStudents],
    unmatchedDates: [...unmatchedDates],
  };
}
