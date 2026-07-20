"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DoneBody() {
  const search = useSearchParams();
  const code = search.get("code") ?? "—";
  const label = search.get("label") ?? "";
  const name = search.get("name") ?? "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Checked in</p>
      <h1 className="text-3xl font-semibold tracking-tight">Code {code}</h1>
      {name ? <p className="text-zinc-700">{name}</p> : null}
      {label ? <p className="text-sm text-zinc-600">{label}</p> : null}
      <Link href="/join" className="mt-4 text-sm text-zinc-600 underline">
        Done
      </Link>
    </main>
  );
}

export default function JoinDonePage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          Loading…
        </p>
      }
    >
      <DoneBody />
    </Suspense>
  );
}
