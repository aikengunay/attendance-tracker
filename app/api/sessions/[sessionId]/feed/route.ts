import { jsonError, unauthorized } from "@/lib/api";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionFeed } from "@/lib/session/feed";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isTeacherAuthenticated())) return unauthorized();
  const { sessionId } = await params;

  try {
    const feed = await getSessionFeed(prisma, sessionId);
    return NextResponse.json(feed);
  } catch (err) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "Feed failed";
    if (code === "NOT_FOUND") return jsonError(code, message, 404);
    return jsonError("FEED_FAILED", message, 400);
  }
}
