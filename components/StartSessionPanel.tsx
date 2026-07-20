"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Template = {
  id: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  roomType: string | null;
  room: string | null;
};

export function StartSessionPanel({
  sectionId,
  templates,
  openSessionId,
}: {
  sectionId: string;
  templates: Template[];
  openSessionId: string | null;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [t0Mode, setT0Mode] = useState<"now" | "scheduled">("now");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onStart(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          templateId: templateId || undefined,
          t0Mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.sessionId) {
          router.push(`/teacher/sessions/${data.sessionId}/projector`);
          return;
        }
        setError(data.message || "Could not start session");
        return;
      }
      router.push(`/teacher/sessions/${data.sessionId}/projector`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onEnd() {
    if (!openSessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${openSessionId}/end`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not end session");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (openSessionId) {
    return (
      <div className="rounded border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-medium text-emerald-900">Session open</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`/teacher/sessions/${openSessionId}/projector`}
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            Open projector QR
          </a>
          <button
            type="button"
            onClick={onEnd}
            disabled={loading}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Ending…" : "End session"}
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={onStart}
      className="flex flex-col gap-3 rounded border border-zinc-200 bg-white p-4"
    >
      <p className="text-sm text-zinc-600">
        Start a capture session for today. Students scan the rotating QR.
      </p>
      {templates.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Schedule</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.dayLabel} {t.startTime}–{t.endTime}
                {t.roomType ? ` · ${t.roomType}` : ""}
                {t.room ? ` · ${t.room}` : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="text-zinc-600">T0 (scoring start)</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="t0"
            checked={t0Mode === "now"}
            onChange={() => setT0Mode("now")}
          />
          Use now
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="t0"
            checked={t0Mode === "scheduled"}
            onChange={() => setT0Mode("scheduled")}
          />
          Use scheduled start
        </label>
      </fieldset>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Starting…" : "Start session"}
      </button>
    </form>
  );
}
