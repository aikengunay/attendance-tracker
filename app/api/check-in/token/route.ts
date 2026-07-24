import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { issuePersonalToken } from "@/lib/session/checkin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { sectionCode?: string; studentId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_REQUEST", "Expected JSON body", 400);
  }

  try {
    const issued = await issuePersonalToken(
      prisma,
      body.sectionCode ?? "",
      body.studentId ?? "",
    );

    // Opaque token only — station scanner accepts raw tokens (and legacy URL form).
    return NextResponse.json({
      ok: true,
      ...issued,
      qrPayload: issued.token,
    });
  } catch (err) {
    const e = err as {
      code?: string;
      codeMark?: number;
      name?: string;
      studentId?: string;
      sectionCode?: string;
      label?: string;
    };
    const code = e.code ?? "TOKEN_FAILED";
    const message = err instanceof Error ? err.message : "Could not issue token";
    const status =
      code === "NOT_IN_SECTION" ||
      code === "SESSION_CLOSED" ||
      code === "ALREADY_CHECKED_IN"
        ? 409
        : 400;

    if (code === "ALREADY_CHECKED_IN") {
      return NextResponse.json(
        {
          error: code,
          message,
          codeMark: e.codeMark,
          name: e.name,
          studentId: e.studentId,
          sectionCode: e.sectionCode,
          label: e.label,
        },
        { status },
      );
    }

    return NextResponse.json({ error: code, message }, { status });
  }
}
