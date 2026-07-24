"use client";

import { FluentAnimatedEmoji } from "@/components/FluentAnimatedEmoji";
import { PulsingQrTile } from "@/components/PulsingQrTile";
import { TicketReassureLine } from "@/components/TicketReassureLine";
import { Button } from "@/components/ui/button";
import { useConfirmIdentityScale } from "@/hooks/use-confirm-identity-scale";
import { useResponsiveQrTile } from "@/hooks/use-responsive-qr-size";
import {
  CONFIRM_FLUENT_NUDGE,
  CONFIRM_FLUENT_SRC,
} from "@/lib/join-ticket-copy";
import { cn } from "@/lib/utils";
import {
  clearJoinTicket,
  loadJoinTicket,
  saveJoinTicket,
} from "@/lib/join-ticket-storage";
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

/** Short course from registrar titles like `CTADWEBL: ADVANCED WEB…`. */
function shortCourseCode(subjectName: string): string {
  const raw = subjectName.trim();
  if (!raw) return "";
  if (raw.includes(":")) {
    return raw.split(":")[0]?.trim() ?? "";
  }
  if (raw.length <= 16 && !/\s/.test(raw)) return raw;
  return "";
}

/** Section first, then short course, then room — no full subject title. */
function formatSessionWhere(
  sectionCode: string,
  subjectName: string,
  room?: string | null,
): string {
  const parts: string[] = [];
  for (const raw of [sectionCode, shortCourseCode(subjectName), room]) {
    const part = raw?.trim();
    if (!part) continue;
    const upper = part.toUpperCase();
    if (parts.some((p) => p.toUpperCase() === upper)) continue;
    parts.push(part);
  }
  return parts.join(" · ").toUpperCase();
}

function goToDone(
  router: ReturnType<typeof useRouter>,
  receipt: {
    code: string | number;
    label?: string;
    name: string;
    studentId: string;
    sectionCode: string;
  },
) {
  clearJoinTicket(receipt.sectionCode, receipt.studentId);
  const qs = new URLSearchParams({
    code: String(receipt.code ?? ""),
    label: receipt.label ?? "",
    name: receipt.name,
    studentId: receipt.studentId,
    sectionCode: receipt.sectionCode,
  });
  router.replace(`/join/done?${qs.toString()}`);
}

export function JoinConfirmTicket({
  sectionCode,
  studentId,
  name,
  subjectName,
  requireConfirm = false,
}: {
  sectionCode: string;
  studentId: string;
  name: string;
  subjectName: string;
  /** True after Find me — show confirm; don’t auto-skip to QR from storage. */
  requireConfirm?: boolean;
}) {
  const router = useRouter();
  const qrTile = useResponsiveQrTile();
  const identityScale = useConfirmIdentityScale(name);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resuming, setResuming] = useState(!requireConfirm);

  const applyIssuedTicket = useCallback(
    (data: {
      token: string;
      qrPayload?: string;
      expiresAt: string;
      name: string;
      studentId: string;
      sectionCode: string;
      subjectName: string;
      meetingStartAt: string;
      meetingEndAt: string;
      room: string | null;
    }) => {
      const qrPayload = data.qrPayload || data.token;
      saveJoinTicket(data.sectionCode, data.studentId, {
        token: data.token,
        expiresAt: data.expiresAt,
      });
      setTicket({
        token: data.token,
        qrPayload,
        name: data.name,
        studentId: data.studentId,
        sectionCode: data.sectionCode,
        subjectName: data.subjectName,
        meetingStartAt: data.meetingStartAt,
        meetingEndAt: data.meetingEndAt,
        room: data.room,
      });
    },
    [],
  );

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
        if (data.error === "ALREADY_CHECKED_IN" && data.codeMark) {
          goToDone(router, {
            code: data.codeMark,
            label: data.label ?? "",
            name: data.name ?? name,
            studentId: data.studentId ?? studentId,
            sectionCode: data.sectionCode ?? sectionCode,
          });
          return;
        }
        setError(data.message || "Could not create check-in QR");
        return;
      }
      applyIssuedTicket(data);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }, [sectionCode, studentId, name, router, applyIssuedTicket]);

  // After Find me: always show confirm (clear any prior ticket).
  // After refresh on an existing ticket: restore QR (or done if already scanned).
  useEffect(() => {
    let cancelled = false;

    if (requireConfirm) {
      clearJoinTicket(sectionCode, studentId);
      setResuming(false);
      // Drop fresh=1 so a later refresh can resume the ticket.
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("fresh")) {
          url.searchParams.delete("fresh");
          window.history.replaceState(null, "", url.pathname + url.search);
        }
      }
      return;
    }

    (async () => {
      const stored = loadJoinTicket(sectionCode, studentId);
      if (!stored?.token) {
        if (!cancelled) setResuming(false);
        return;
      }
      let leftForDone = false;
      try {
        const statusRes = await fetch(
          `/api/check-in/status?token=${encodeURIComponent(stored.token)}`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (status.checkedIn) {
            leftForDone = true;
            goToDone(router, {
              code: status.code,
              label: status.label ?? "",
              name: status.name ?? name,
              studentId: status.studentId ?? studentId,
              sectionCode: status.sectionCode ?? sectionCode,
            });
            return;
          }
        }

        const res = await fetch("/api/check-in/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionCode, studentId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          if (data.error === "ALREADY_CHECKED_IN" && data.codeMark) {
            leftForDone = true;
            goToDone(router, {
              code: data.codeMark,
              label: data.label ?? "",
              name: data.name ?? name,
              studentId: data.studentId ?? studentId,
              sectionCode: data.sectionCode ?? sectionCode,
            });
            return;
          }
          clearJoinTicket(sectionCode, studentId);
          setError(data.message || "Could not restore check-in QR");
          return;
        }
        applyIssuedTicket(data);
      } catch {
        clearJoinTicket(sectionCode, studentId);
      } finally {
        if (!cancelled && !leftForDone) setResuming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Mount / identity only — avoid re-issue loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionCode, studentId, requireConfirm]);

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
          goToDone(router, {
            code: data.code ?? "",
            label: data.label ?? "",
            name: data.name ?? ticket.name,
            studentId: data.studentId ?? ticket.studentId,
            sectionCode: data.sectionCode ?? ticket.sectionCode,
          });
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

  if (resuming) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3 py-16">
        <p className="text-sm text-muted-foreground">Preparing your check-in…</p>
      </div>
    );
  }

  if (ticket) {
    const when = formatSessionWhen(
      ticket.meetingStartAt,
      ticket.meetingEndAt,
    );
    const where = formatSessionWhere(
      ticket.sectionCode,
      ticket.subjectName,
      ticket.room,
    );

    return (
      <div className="flex min-h-[calc(100svh-2rem)] w-full max-w-sm flex-col md:min-h-[calc(100svh-5rem)]">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-4 sm:gap-8">
          {/* Context — quiet; never competes with QR / name */}
          <div className="space-y-1 text-center">
            <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground sm:text-xs">
              {when}
            </p>
            <p className="text-[11px] tracking-wide text-muted-foreground/80 sm:text-xs">
              {where}
            </p>
          </div>

          <PulsingQrTile
            data={ticket.qrPayload}
            size={qrTile.size}
            padding={qrTile.padding}
            borderRadius={qrTile.radius}
          />

          {/* Identity — strongest text after the QR */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-wide uppercase sm:text-xl">
                {ticket.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {ticket.studentId}
              </p>
            </div>
            <TicketReassureLine />
          </div>
        </div>

        <Link
          href="/join"
          className="inline-flex min-h-11 shrink-0 items-center justify-center px-4 py-3 text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:self-center"
        >
          Cancel
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-2rem)] w-full max-w-sm flex-col md:min-h-[calc(100svh-5rem)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6">
        <div
          className="flex items-center justify-center"
          style={{
            transform: `translate(${CONFIRM_FLUENT_NUDGE.x}px, ${CONFIRM_FLUENT_NUDGE.y}px)`,
          }}
        >
          <FluentAnimatedEmoji
            src={CONFIRM_FLUENT_SRC}
            size={identityScale.emojiSize}
            alt=""
          />
        </div>

        <h1 className="font-heading text-xl font-medium tracking-tight text-foreground/80 sm:text-2xl">
          Is this you?
        </h1>

        <div className="w-full max-w-full space-y-2 px-1 text-center">
          <p
            className={cn(
              "mx-auto max-w-full font-semibold uppercase leading-snug tracking-wide break-words hyphens-none",
              identityScale.nameClass,
            )}
          >
            {name}
          </p>
          <p
            className={cn(
              "font-mono text-muted-foreground",
              identityScale.idClass,
            )}
          >
            {studentId}
          </p>
        </div>

        {error ? (
          <p className="text-center text-sm text-destructive">{error}</p>
        ) : null}

        <div className="flex w-full flex-col items-center gap-1 pt-2">
          <Button
            variant="chunky"
            size="xl"
            className="w-full"
            disabled={busy}
            onClick={() => void issueTicket()}
          >
            {busy ? "Preparing…" : "This is me"}
          </Button>
          <Link
            href={`/join?sectionCode=${encodeURIComponent(sectionCode)}&studentId=${encodeURIComponent(studentId)}`}
            className="inline-flex min-h-11 items-center justify-center px-4 py-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Not me
          </Link>
        </div>
      </div>
    </div>
  );
}
