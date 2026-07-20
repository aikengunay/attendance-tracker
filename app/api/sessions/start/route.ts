import { jsonError, unauthorized } from "@/lib/api";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startSession } from "@/lib/session/lifecycle";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!(await isTeacherAuthenticated())) return unauthorized();

  let body: {
    sectionId?: string;
    templateId?: string;
    date?: string;
    t0Mode?: "scheduled" | "now";
    title?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonError("BAD_REQUEST", "Expected JSON body", 400);
  }

  if (!body.sectionId || !body.t0Mode) {
    return jsonError("BAD_REQUEST", "sectionId and t0Mode are required", 400);
  }
  if (body.t0Mode !== "scheduled" && body.t0Mode !== "now") {
    return jsonError("BAD_REQUEST", "t0Mode must be scheduled or now", 400);
  }

  try {
    const result = await startSession(prisma, {
      sectionId: body.sectionId,
      templateId: body.templateId,
      date: body.date,
      t0Mode: body.t0Mode,
      title: body.title,
    });
    return NextResponse.json({
      sessionId: result.session.id,
      meetingId: result.meeting.id,
      sectionCode: result.section.code,
      t0: result.session.t0.toISOString(),
      status: result.session.status,
      token: result.qr.token,
      expiresAt: result.qr.expiresAt.toISOString(),
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "Start failed";
    if (code === "SESSION_ALREADY_OPEN") {
      return NextResponse.json(
        {
          error: code,
          message,
          sessionId: (err as { sessionId?: string }).sessionId,
        },
        { status: 409 },
      );
    }
    if (code === "NOT_FOUND") return jsonError(code, message, 404);
    return jsonError("START_FAILED", message, 400);
  }
}
