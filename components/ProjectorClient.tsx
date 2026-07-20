"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type QrPayload = {
  sectionCode: string;
  token: string;
  secondsLeft: number;
  qrDataUrl: string;
  checkInUrl: string;
  status: string;
  counts: { checkedIn: number; roster: number };
};

type FeedLatest = {
  name: string;
  code: number;
  source: string;
} | null;

export function ProjectorClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<QrPayload | null>(null);
  const [latest, setLatest] = useState<FeedLatest>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const poll = useCallback(async () => {
    try {
      const [qrRes, feedRes] = await Promise.all([
        fetch(`/api/sessions/${sessionId}/qr`, { cache: "no-store" }),
        fetch(`/api/sessions/${sessionId}/feed`, { cache: "no-store" }),
      ]);
      const qrJson = await qrRes.json();
      if (!qrRes.ok) {
        setError(qrJson.message || "QR unavailable");
        return;
      }
      setError(null);
      setData(qrJson);

      if (feedRes.ok) {
        const feedJson = await feedRes.json();
        setLatest(feedJson.latest ?? null);
        if (feedJson.counts) {
          setData((d) =>
            d
              ? {
                  ...d,
                  counts: {
                    checkedIn: feedJson.counts.checkedIn,
                    roster: feedJson.counts.roster,
                  },
                }
              : d,
          );
        }
      }
    } catch {
      setError("Network error");
    }
  }, [sessionId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [poll]);

  async function endSession() {
    setEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/teacher/sessions/${sessionId}/roster`);
        router.refresh();
      }
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{data?.sectionCode ?? "Session"}</p>
          <p className="text-xs text-zinc-500">
            Checked in {data?.counts.checkedIn ?? 0} / {data?.counts.roster ?? "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/teacher/sessions/${sessionId}/roster`}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Roster
          </Link>
          <button
            type="button"
            onClick={endSession}
            disabled={ending}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {ending ? "Ending…" : "End session"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4">
        {error ? <p className="text-red-600">{error}</p> : null}
        {latest ? (
          <p className="max-w-3xl text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {latest.name}
            <span className="ml-3 text-xl font-normal text-zinc-500">
              code {latest.code}
            </span>
          </p>
        ) : (
          <p className="text-lg text-zinc-400">Waiting for check-ins…</p>
        )}
        {data?.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.qrDataUrl}
            alt="Check-in QR"
            className="h-[min(60vw,360px)] w-[min(60vw,360px)]"
          />
        ) : (
          <p className="text-zinc-500">Loading QR…</p>
        )}
        <p className="text-4xl font-semibold tabular-nums">
          {data ? `${data.secondsLeft}s` : "—"}
        </p>
        <p className="text-center text-sm text-zinc-600">
          Fallback code:{" "}
          <span className="font-mono text-lg text-zinc-900">
            {data?.token ?? "—"}
          </span>
        </p>
      </div>
    </div>
  );
}
