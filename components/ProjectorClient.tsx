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

export function ProjectorClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<QrPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/qr`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "QR unavailable");
        return;
      }
      setError(null);
      setData(json);
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
      const res = await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
      if (res.ok) {
        router.push("/teacher");
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
            href="/teacher"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Back
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

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        {error ? <p className="text-red-600">{error}</p> : null}
        {data?.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.qrDataUrl}
            alt="Check-in QR"
            className="h-[min(70vw,420px)] w-[min(70vw,420px)]"
          />
        ) : (
          <p className="text-zinc-500">Loading QR…</p>
        )}
        <p className="text-4xl font-semibold tabular-nums">
          {data ? `${data.secondsLeft}s` : "—"}
        </p>
        <p className="text-center text-sm text-zinc-600">
          Fallback code:{" "}
          <span className="font-mono text-lg text-zinc-900">{data?.token ?? "—"}</span>
        </p>
        <p className="max-w-lg break-all text-center text-xs text-zinc-400">
          {data?.checkInUrl}
        </p>
      </div>
    </div>
  );
}
