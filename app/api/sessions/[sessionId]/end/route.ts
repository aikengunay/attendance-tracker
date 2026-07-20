import { jsonError, unauthorized } from "@/lib/api";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { endSession } from "@/lib/session/lifecycle";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_req: Request, { params }: Params) {
  if (!(await isTeacherAuthenticated())) return unauthorized();
  const { sessionId } = await params;

  try {
    const result = await endSession(prisma, sessionId);
    return NextResponse.json({
      sessionId: result.session.id,
      status: result.session.status,
      closedAt: result.session.closedAt?.toISOString() ?? null,
      markedAbsent: result.markedAbsent,
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "End failed";
    if (code === "NOT_FOUND") return jsonError(code, message, 404);
    return jsonError("END_FAILED", message, 400);
  }
}
