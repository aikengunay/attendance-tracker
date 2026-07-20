"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

function speakName(name: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const last = name.split(",")[0]?.trim() || name;
  const utter = new SpeechSynthesisUtterance(`${last}, checked in`);
  utter.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

export function ProjectorClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<QrPayload | null>(null);
  const [latest, setLatest] = useState<FeedLatest>(null);
  const [announce, setAnnounce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const lastSpoken = useRef<string | null>(null);

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
        const nextLatest = (feedJson.latest ?? null) as FeedLatest;
        setLatest(nextLatest);
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

  useEffect(() => {
    if (!announce || !latest?.name) return;
    const key = `${latest.name}|${latest.code}|${latest.source}`;
    if (lastSpoken.current === key) return;
    lastSpoken.current = key;
    speakName(latest.name);
  }, [announce, latest]);

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
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{data?.sectionCode ?? "Session"}</p>
          <p className="text-xs text-zinc-500">
            Checked in {data?.counts.checkedIn ?? 0} / {data?.counts.roster ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 rounded border border-zinc-300 px-3 py-1.5 text-sm">
            <input
              type="checkbox"
              checked={announce}
              onChange={(e) => setAnnounce(e.target.checked)}
            />
            Announce names
          </label>
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
          <p className="max-w-3xl text-center text-3xl font-semibold tracking-tight sm:text-5xl">
            {latest.name}
            <span className="ml-3 text-xl font-normal text-zinc-500 sm:text-2xl">
              code {latest.code}
            </span>
          </p>
        ) : (
          <p className="text-lg text-zinc-400 sm:text-xl">Waiting for check-ins…</p>
        )}
        {data?.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.qrDataUrl}
            alt="Check-in QR"
            className="h-[min(62vw,380px)] w-[min(62vw,380px)]"
          />
        ) : (
          <p className="text-zinc-500">Loading QR…</p>
        )}
        <p className="text-4xl font-semibold tabular-nums sm:text-5xl">
          {data ? `${data.secondsLeft}s` : "—"}
        </p>
        <p className="text-center text-sm text-zinc-600 sm:text-base">
          Fallback code:{" "}
          <span className="font-mono text-lg text-zinc-900 sm:text-xl">
            {data?.token ?? "—"}
          </span>
        </p>
        <p className="max-w-lg break-all text-center text-xs text-zinc-400">
          {data?.checkInUrl}
        </p>
      </div>
    </div>
  );
}
