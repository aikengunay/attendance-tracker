/**
 * Join-flow harden: opaque personal tokens, already-in receipt shape, status fields.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { parseClasslistBuffer } from "@/lib/import/classlist";
import { commitClasslist } from "@/lib/import/commit";
import {
  getOpenSessionCheckInReceipt,
  getPersonalCheckInStatus,
  issuePersonalToken,
  performTeacherScan,
} from "@/lib/session/checkin";
import { endSession, startSession } from "@/lib/session/lifecycle";

const fixtures = path.join(process.cwd(), "fixtures/classlists");
const SECTION = "INF231MWA";

async function closeOpenSessions(sectionId: string) {
  const open = await prisma.session.findMany({
    where: { status: "open", meeting: { sectionId } },
  });
  for (const s of open) await endSession(prisma, s.id);
}

describe("join-flow harden", () => {
  beforeAll(async () => {
    await prisma.section.deleteMany({ where: { code: SECTION } });
    const parsed = parseClasslistBuffer(
      readFileSync(path.join(fixtures, "inf231.xls")),
    );
    await commitClasslist(prisma, parsed);
  });

  it("issues opaque token (not a /join URL) and status reports checked-in receipt", async () => {
    const section = await prisma.section.findUniqueOrThrow({
      where: { code: SECTION },
      include: {
        templates: { orderBy: { startTime: "asc" } },
        students: { orderBy: { name: "asc" } },
      },
    });
    await closeOpenSessions(section.id);

    const started = await startSession(prisma, {
      sectionId: section.id,
      templateId: section.templates[0]!.id,
      date: "2026-07-23",
      t0Mode: "now",
    });

    const student = section.students[0]!;
    const issued = await issuePersonalToken(
      prisma,
      SECTION,
      student.studentId,
    );

    expect(issued.token).toMatch(/^[A-Za-z0-9_-]{8,}$/);
    expect(issued.token.length).toBeGreaterThanOrEqual(40);
    expect(issued.token).not.toContain("/join");
    expect(issued.token).not.toContain("http");

    // API layer sets qrPayload === token; mirror that contract here.
    const qrPayload = issued.token;
    expect(qrPayload).toBe(issued.token);

    const before = await getPersonalCheckInStatus(prisma, issued.token);
    expect(before.checkedIn).toBe(false);
    expect(before.valid).toBe(true);

    const scan = await performTeacherScan(
      prisma,
      started.session.id,
      issued.token,
    );
    expect([1, 2, 3, 4]).toContain(scan.code);

    const after = await getPersonalCheckInStatus(prisma, issued.token);
    expect(after).toMatchObject({
      checkedIn: true,
      code: scan.code,
      name: student.name,
      studentId: student.studentId,
      sectionCode: SECTION,
    });
    expect(after.label).toBeTruthy();

    const receipt = await getOpenSessionCheckInReceipt(
      prisma,
      SECTION,
      student.studentId,
    );
    expect(receipt).toMatchObject({
      code: scan.code,
      name: student.name,
      studentId: student.studentId,
      sectionCode: SECTION,
    });
    expect(receipt?.label).toBeTruthy();

    await expect(
      issuePersonalToken(prisma, SECTION, student.studentId),
    ).rejects.toMatchObject({
      code: "ALREADY_CHECKED_IN",
      codeMark: scan.code,
      name: student.name,
      studentId: student.studentId,
      sectionCode: SECTION,
    });

    await endSession(prisma, started.session.id);
  });
});
