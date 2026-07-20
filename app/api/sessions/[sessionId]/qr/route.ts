import { jsonError, unauthorized } from "@/lib/api";
import { isTeacherAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureCurrentQrToken } from "@/lib/session/lifecycle";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(req: Request, { params }: Params) {
  if (!(await isTeacherAuthenticated())) return unauthorized();
  const { sessionId } = await params;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { meeting: { include: { section: true } } },
    });
    if (!session) return jsonError("NOT_FOUND", "Session not found", 404);

    const qr = await ensureCurrentQrToken(prisma, sessionId);
    const origin = new URL(req.url).origin;
    const checkInUrl = `${origin}/join?token=${encodeURIComponent(qr.token)}&sectionCode=${encodeURIComponent(session.meeting.section.code)}`;
    const secondsLeft = Math.max(
      0,
      Math.ceil((qr.expiresAt.getTime() - Date.now()) / 1000),
    );
    const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
    });

    const checkedIn = await prisma.attendance.count({
      where: { sessionId, code: { gt: 0 } },
    });
    const roster = await prisma.student.count({
      where: { sectionId: session.meeting.sectionId, active: true },
    });

    return NextResponse.json({
      sessionId,
      status: session.status,
      sectionCode: session.meeting.section.code,
      token: qr.token,
      expiresAt: qr.expiresAt.toISOString(),
      secondsLeft,
      checkInUrl,
      qrDataUrl,
      t0: session.t0.toISOString(),
      counts: { checkedIn, roster },
    });
  } catch (err) {
    const code = (err as { code?: string }).code;
    const message = err instanceof Error ? err.message : "QR failed";
    if (code === "SESSION_CLOSED") return jsonError(code, message, 409);
    if (code === "NOT_FOUND") return jsonError(code, message, 404);
    return jsonError("QR_FAILED", message, 400);
  }
}
