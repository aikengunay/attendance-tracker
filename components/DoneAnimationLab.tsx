"use client";

import { JoinCheckedInPreview } from "@/components/JoinCheckedIn";
import { BrandLockup } from "@/components/teacher/brand-lockup";
import { Button } from "@/components/ui/button";
import { STUDENT_STATUS, type AttendanceCode } from "@/lib/attendance-copy";
import Link from "next/link";
import { useState } from "react";

const CODES: AttendanceCode[] = [1, 2, 3, 4];

function Sample({
  title,
  subtitle,
  onReplay,
  children,
}: {
  title: string;
  subtitle: string;
  onReplay: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-background/70">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="space-y-0.5">
          <h2 className="font-heading text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onReplay}>
          Replay
        </Button>
      </div>
      <div className="relative flex min-h-[420px] flex-col items-center justify-center bg-muted/40 p-6">
        {children}
      </div>
    </section>
  );
}

export function DoneAnimationLab() {
  const [keys, setKeys] = useState<Record<AttendanceCode, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  return (
    <div className="min-h-svh bg-muted px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <BrandLockup href="/" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Done animation lab
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Three-line receipt: points (hero), encourage (personal pool),
              status (quiet). Confetti full for 1, softer for 2–3, off for 4.
            </p>
          </div>
          <Link
            href="/join/done?code=1&name=Sample%20Student&label=On%20time"
            className="text-sm underline underline-offset-4 hover:text-foreground"
          >
            Real /join/done
          </Link>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {CODES.map((code) => {
            const s = STUDENT_STATUS[code];
            return (
              <Sample
                key={code}
                title={`Code ${code} · ${s.points} pt`}
                subtitle={`${s.pointsLine} · ${s.detail}`}
                onReplay={() =>
                  setKeys((k) => ({ ...k, [code]: k[code] + 1 }))
                }
              >
                <JoinCheckedInPreview code={code} playKey={keys[code]} />
              </Sample>
            );
          })}
        </div>
      </div>
    </div>
  );
}
