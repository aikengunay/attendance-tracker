"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function JoinForm() {
  const router = useRouter();
  const search = useSearchParams();
  const tokenFromQr = search.get("token") ?? "";
  const sectionFromQr = search.get("sectionCode") ?? "";

  const [sectionCode, setSectionCode] = useState(sectionFromQr);
  const [studentId, setStudentId] = useState("");
  const [token, setToken] = useState(tokenFromQr);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("at_student_id");
    if (saved && !studentId) setStudentId(saved);
  }, [studentId]);

  async function onLookup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setName(null);
    try {
      const qs = new URLSearchParams({
        sectionCode: sectionCode.trim(),
        studentId: studentId.trim(),
      });
      const res = await fetch(`/api/students/lookup?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Not found");
        return;
      }
      setName(data.name);
      localStorage.setItem("at_student_id", studentId.trim());
    } finally {
      setLoading(false);
    }
  }

  async function onConfirm() {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      if (!token.trim()) {
        setError("Enter the fallback code from the projector, or scan the QR again.");
        return;
      }
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId.trim(),
          sectionCode: sectionCode.trim(),
          token: token.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Check-in failed");
        return;
      }
      const qs = new URLSearchParams({
        code: String(data.code),
        label: data.label,
        name: data.name,
      });
      router.push(`/join/done?${qs}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Student</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Check in</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Enter your Student ID, confirm your name, then submit with the classroom QR
          token.
        </p>
      </div>

      {!name ? (
        <form onSubmit={onLookup} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Section</span>
            <input
              value={sectionCode}
              onChange={(e) => setSectionCode(e.target.value.toUpperCase())}
              required
              placeholder="INF231MWA"
              className="rounded border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">Student ID</span>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              placeholder="2023-100964"
              className="rounded border border-zinc-300 px-3 py-2 font-mono"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Looking up…" : "Find me"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Is this you?</p>
            <p className="mt-1 text-lg font-medium">{name}</p>
            <p className="font-mono text-sm text-zinc-600">{studentId}</p>
            <p className="text-sm text-zinc-600">{sectionCode}</p>
          </div>
          {!tokenFromQr ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">Projector fallback code</span>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="rounded border border-zinc-300 px-3 py-2 font-mono"
              />
            </label>
          ) : (
            <p className="text-xs text-zinc-500">QR token ready from scan.</p>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setName(null);
                setError(null);
              }}
              className="rounded border border-zinc-300 px-4 py-2 text-sm"
            >
              Not me
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Checking in…" : "This is me — check in"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          Loading…
        </p>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
