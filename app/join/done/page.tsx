"use client";

import { JoinCheckedIn } from "@/components/JoinCheckedIn";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DoneBody() {
  const search = useSearchParams();
  const code = search.get("code") ?? "—";
  const label = search.get("label") ?? "";
  const name = search.get("name") ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 md:p-10">
      <JoinCheckedIn name={name} code={code} label={label} />
    </div>
  );
}

export default function JoinDonePage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-svh items-center justify-center bg-background text-sm text-muted-foreground">
          Loading…
        </p>
      }
    >
      <DoneBody />
    </Suspense>
  );
}
