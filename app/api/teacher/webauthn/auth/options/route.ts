import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  storeWebAuthnChallenge,
  webAuthnRpConfig,
} from "@/lib/webauthn";
import { clientIpFromHeaders, isRateLimited } from "@/lib/rate-limit";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const ip = clientIpFromHeaders(req.headers);
  if (isRateLimited(ip)) {
    return jsonError(
      "RATE_LIMITED",
      "Too many failed login attempts. Try again in 15 minutes.",
      429,
    );
  }

  const { rpID } = webAuthnRpConfig(req);
  const passkeys = await prisma.teacherPasskey.findMany();
  if (passkeys.length === 0) {
    return jsonError(
      "NO_PASSKEYS",
      "No passkey enrolled yet. Sign in with your password, then add one under Settings.",
      400,
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    // Empty = discoverable / Conditional UI
    allowCredentials: [],
  });

  storeWebAuthnChallenge(options.challenge);
  return NextResponse.json(options);
}
