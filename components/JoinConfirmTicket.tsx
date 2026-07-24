"use client";

import { BrandLockup } from "@/components/teacher/brand-lockup";
import { PulsingQrTile } from "@/components/PulsingQrTile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useResponsiveQrTile } from "@/hooks/use-responsive-qr-size";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type TicketData = {
  token: string;
  qrPayload: string;
  name: string;
  studentId: string;
  sectionCode: string;
  subjectName: string;
  meetingStartAt: string;
  meetingEndAt: string;
  room: string | null;
};

function formatSessionWhen(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Manila",
  });
  const t0 = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  const t1 = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
  return `${day.toUpperCase()}, ${t0.toUpperCase()} – ${t1.toUpperCase()}`;
}

export function JoinConfirmTicket({
  sectionCode,
  studentId,
  name,
  subjectName,
}: {
  sectionCode: string;
  studentId: string;
  name: string;
  subjectName: string;
}) {
  const router = useRouter();
  const qrTile = useResponsiveQrTile();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const issueTicket = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/check-in/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionCode, studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not create check-in QR");
        return;
      }
      setTicket({
        token: data.token,
        qrPayload: data.qrPayload,
        name: data.name,
        studentId: data.studentId,
        sectionCode: data.sectionCode,
        subjectName: data.subjectName,
        meetingStartAt: data.meetingStartAt,
        meetingEndAt: data.meetingEndAt,
        room: data.room,
      });
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }, [sectionCode, studentId]);

  useEffect(() => {
    if (!ticket?.token) return;
    let cancelled = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/check-in/status?token=${encodeURIComponent(ticket.token)}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.checkedIn) {
          const qs = new URLSearchParams({
            code: String(data.code ?? ""),
            label: data.label ?? "",
            name: data.name ?? ticket.name,
          });
          router.replace(`/join/done?${qs.toString()}`);
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ticket, router]);

  if (ticket) {
    const when = formatSessionWhen(
      ticket.meetingStartAt,
      ticket.meetingEndAt,
    );
    const where = [ticket.sectionCode, ticket.subjectName, ticket.room]
      .filter(Boolean)
      .join(" · ")
      .toUpperCase();

    return (
      <div className="flex min-h-[calc(100svh-2rem)] w-full max-w-sm flex-col md:min-h-[calc(100svh-5rem)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4 sm:gap-8">
          <BrandLockup className="self-center" size="lg" />

          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold tracking-[0.14em] text-foreground">
              {when}
            </p>
            <p className="text-xs tracking-wide text-muted-foreground">
              {where}
            </p>
          </div>

          <PulsingQrTile
            data={ticket.qrPayload}
            size={qrTile.size}
            padding={qrTile.padding}
            borderRadius={qrTile.radius}
          />

          <div className="space-y-1 text-center">
            <p className="text-lg font-semibold tracking-wide uppercase">
              {ticket.name}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {ticket.studentId}
            </p>
            <p className="pt-2 text-sm text-muted-foreground">
              Waiting for teacher to scan…
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="lg"
          className="w-full shrink-0 text-muted-foreground"
          nativeButton={false}
          render={<Link href="/join" />}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <BrandLockup className="self-center" size="lg" />
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Is this you?</CardTitle>
          <CardDescription>
            Confirm, then show your QR at the station.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-center">
            <p className="text-xl font-medium leading-snug">{name}</p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {studentId}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {sectionCode}
              {subjectName ? ` · ${subjectName}` : ""}
            </p>
          </div>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() => void issueTicket()}
          >
            {busy ? "Preparing…" : "This is me"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            nativeButton={false}
            render={
              <Link
                href={`/join?sectionCode=${encodeURIComponent(sectionCode)}&studentId=${encodeURIComponent(studentId)}`}
              />
            }
          >
            Not me
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
