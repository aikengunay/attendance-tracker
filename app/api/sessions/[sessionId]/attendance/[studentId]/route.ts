import { jsonError, unauthorized } from "@/lib/api";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setManualAttendance } from "@/lib/session/override";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ sessionId: string; studentId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isTeacherAuthenticated())) return unauthorized();
  const { sessionId, studentId } = await params;

  let body: { code?: number; note?: string | null };
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_REQUEST", "Expected JSON body", 400);
  }

  if (body.code === undefined) {
    return jsonError("BAD_REQUEST", "code is required", 400);
  }

  try {
    const result = await setManualAttendance(prisma, {
      sessionId,
      studentKey: studentId,
      code: body.code,
      note: body.note,
    });
    return NextResponse.json({ ok: true, attendance: result });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "Override failed";
    if (code === "NOT_FOUND") return jsonError(code, message, 404);
    if (code === "NOT_IN_SECTION") return jsonError(code, message, 404);
    if (code === "BAD_REQUEST") return jsonError(code, message, 400);
    return jsonError("OVERRIDE_FAILED", message, 400);
  }
}
