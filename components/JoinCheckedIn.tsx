"use client";

import { FluentAnimatedEmoji } from "@/components/FluentAnimatedEmoji";
import { Button } from "@/components/ui/button";
import {
  encourageLineFor,
  parseAttendanceCode,
  studentStatusFor,
  type AttendanceCode,
} from "@/lib/attendance-copy";
import { fireCheckInConfetti } from "@/lib/success-confetti";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Visual hierarchy (3 lines only):
 * 1. Points — hero
 * 2. Encourage — personal / emotional
 * 3. Status — quiet fact (On time / Late …)
 */
function ReceiptBody({
  name,
  code,
  label,
}: {
  name: string;
  code: string;
  label?: string;
}) {
  const parsed = parseAttendanceCode(code);
  const status = parsed ? studentStatusFor(parsed) : null;
  const pointsLine = status?.pointsLine ?? "You're checked in";
  const detail = status?.detail ?? label ?? "";
  const encourage = parsed ? encourageLineFor(parsed, name) : "";

  return (
    <>
      <div className="presentpo-check-pop">
        {status ? (
          <FluentAnimatedEmoji src={status.fluentSrc} size={112} alt="" />
        ) : (
          <span className="text-6xl" aria-hidden>
            ✅
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {pointsLine}
        </h1>
        {encourage ? (
          <p className="max-w-[20rem] text-base font-medium leading-snug text-foreground/90">
            {encourage}
          </p>
        ) : null}
        {detail ? (
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {detail}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function JoinCheckedIn({
  name,
  code,
  label,
  celebrate = true,
}: {
  name: string;
  code: string;
  label?: string;
  celebrate?: boolean;
}) {
  useEffect(() => {
    if (!celebrate) return;
    const parsed = parseAttendanceCode(code);
    if (parsed) fireCheckInConfetti(parsed);
  }, [celebrate, code]);

  return (
    <div className="flex min-h-[calc(100svh-2rem)] w-full max-w-sm flex-col md:min-h-[calc(100svh-5rem)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <ReceiptBody name={name} code={code} label={label} />
      </div>

      <Button
        size="lg"
        className="w-full shrink-0 sm:w-auto sm:self-center sm:px-8"
        nativeButton={false}
        render={<Link href="/join" />}
      >
        Done
      </Button>
    </div>
  );
}

/** Lab helper: same receipt chrome without Done link. */
export function JoinCheckedInPreview({
  code,
  name = "GUNAY, AIKEN JOAQUIN E.",
  playKey = 0,
}: {
  code: AttendanceCode;
  name?: string;
  playKey?: number;
}) {
  const status = studentStatusFor(code);

  useEffect(() => {
    fireCheckInConfetti(code);
  }, [playKey, code]);

  return (
    <div
      key={playKey}
      className="flex w-full max-w-xs flex-col items-center gap-6 px-4 py-10"
    >
      <ReceiptBody name={name} code={String(code)} label={status.detail} />
    </div>
  );
}
