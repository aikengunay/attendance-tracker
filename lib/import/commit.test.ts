import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { parseClasslistBuffer } from "./classlist";
import { commitClasslist } from "./commit";

const fixtures = path.join(process.cwd(), "fixtures/classlists");

describe("commitClasslist", () => {
  it("upserts INF231 and INF232 without wiping on re-import", async () => {
    const inf231 = parseClasslistBuffer(
      readFileSync(path.join(fixtures, "inf231.xls")),
    );
    const first = await commitClasslist(prisma, inf231);
    expect(first.studentCount).toBe(40);

    const again = await commitClasslist(prisma, inf231);
    expect(again.sectionId).toBe(first.sectionId);

    const inf232 = parseClasslistBuffer(
      readFileSync(path.join(fixtures, "inf232.xls")),
    );
    const s232 = await commitClasslist(prisma, inf232);
    expect(s232.studentCount).toBe(22);

    const counts = await prisma.section.findMany({
      where: { code: { in: ["INF231MWA", "INF232MWA"] } },
      orderBy: { code: "asc" },
      include: { _count: { select: { students: true, templates: true } } },
    });
    expect(counts.map((s) => [s.code, s._count.students, s._count.templates])).toEqual([
      ["INF231MWA", 40, 2],
      ["INF232MWA", 22, 2],
    ]);
  });
});

