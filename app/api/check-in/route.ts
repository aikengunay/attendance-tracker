import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { performCheckIn } from "@/lib/session/checkin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { studentId?: string; sectionCode?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_REQUEST", "Expected JSON body", 400);
  }

  try {
    const result = await performCheckIn(prisma, {
      studentId: body.studentId ?? "",
      sectionCode: body.sectionCode ?? "",
      token: body.token ?? "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const code = (err as { code?: string }).code ?? "CHECKIN_FAILED";
    const message = err instanceof Error ? err.message : "Check-in failed";
    const status =
      code === "TOKEN_EXPIRED" ||
      code === "SESSION_CLOSED" ||
      code === "ALREADY_CHECKED_IN" ||
      code === "TOO_EARLY" ||
      code === "NOT_IN_SECTION"
        ? 409
        : code === "BAD_REQUEST"
          ? 400
          : 400;
    return NextResponse.json({ error: code, message }, { status });
  }
}
