"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type RosterRow = {
  id: string;
  studentId: string;
  name: string;
  code: number | null;
  source: string | null;
  checkedInAt: string | null;
  note: string | null;
};

type Feed = {
  sessionId: string;
  status: string;
  sectionCode: string;
  sectionId: string;
  counts: {
    roster: number;
    marked: number;
    checkedIn: number;
    unmarked: number;
  };
  latest: { name: string; code: number } | null;
  roster: RosterRow[];
};

export function RosterClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [unmarkedOnly, setUnmarkedOnly] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, { code: string; note: string }>
  >({});

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/feed`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Feed unavailable");
        return;
      }
      setError(null);
      setFeed(data);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const row of data.roster as RosterRow[]) {
          if (!next[row.id]) {
            next[row.id] = {
              code: row.code === null ? "" : String(row.code),
              note: row.note ?? "",
            };
          }
        }
        return next;
      });
    } catch {
      setError("Network error");
    }
  }, [sessionId]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [poll]);

  const rows = useMemo(() => {
    if (!feed) return [];
    const q = query.trim().toLowerCase();
    return feed.roster.filter((r) => {
      if (unmarkedOnly && r.code !== null) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q)
      );
    });
  }, [feed, query, unmarkedOnly]);

  async function saveRow(row: RosterRow) {
    const draft = drafts[row.id];
    if (!draft) return;
    const code = Number(draft.code);
    if (!Number.isInteger(code) || code < 0 || code > 4) {
      setError("Code must be 0–4");
      return;
    }
    setSavingId(row.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/attendance/${row.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            note: draft.note.trim() || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Save failed");
        return;
      }
      await poll();
    } finally {
      setSavingId(null);
    }
  }

  async function endSession() {
    setEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      });
      if (res.ok) {
        setDrafts({});
        await poll();
        router.refresh();
      }
    } finally {
      setEnding(false);
    }
  }

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/teacher" className="hover:underline">
              Sections
            </Link>
            {feed ? (
              <>
                <span className="mx-1">/</span>
                <Link
                  href={`/teacher/sections/${feed.sectionId}`}
                  className="hover:underline"
                >
                  {feed.sectionCode}
                </Link>
              </>
            ) : null}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Live roster
          </h1>
          <p className="text-sm text-zinc-600">
            {feed
              ? `${feed.counts.checkedIn} present · ${feed.counts.unmarked} unmarked · ${feed.counts.roster} roster · ${feed.status}`
              : "Loading…"}
          </p>
          {feed?.latest ? (
            <p className="mt-1 text-sm text-zinc-800">
              Latest: <span className="font-medium">{feed.latest.name}</span>{" "}
              (code {feed.latest.code})
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teacher/sessions/${sessionId}/projector`}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          >
            Projector
          </Link>
          {feed?.status === "open" ? (
            <button
              type="button"
              onClick={endSession}
              disabled={ending}
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {ending ? "Ending…" : "End session"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or ID"
          className="min-w-[200px] flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={unmarkedOnly}
            onChange={(e) => setUnmarkedOnly(e.target.checked)}
          />
          Unmarked only
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Student</th>
              <th className="px-3 py-2 font-medium">Current</th>
              <th className="px-3 py-2 font-medium">Set code</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const draft = drafts[row.id] ?? { code: "", note: "" };
              return (
                <tr key={row.id} className="border-b border-zinc-100 align-top">
                  <td className="px-3 py-2">
                    <p className="font-medium">{row.name}</p>
                    <p className="font-mono text-xs text-zinc-500">
                      {row.studentId}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {row.code === null ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <>
                        <span className="font-semibold">{row.code}</span>
                        <span className="text-xs text-zinc-500">
                          {" "}
                          · {row.source}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={draft.code}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [row.id]: { ...draft, code: e.target.value },
                        }))
                      }
                      className="rounded border border-zinc-300 px-2 py-1"
                    >
                      <option value="">—</option>
                      {[0, 1, 2, 3, 4].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={draft.note}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [row.id]: { ...draft, note: e.target.value },
                        }))
                      }
                      placeholder="optional"
                      className="w-40 rounded border border-zinc-300 px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => saveRow(row)}
                      disabled={savingId === row.id || draft.code === ""}
                      className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                    >
                      {savingId === row.id ? "…" : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  No students match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
