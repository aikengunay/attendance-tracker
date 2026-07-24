"use client";

import { BrandLockup } from "@/components/teacher/brand-lockup";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DoneBody() {
  const search = useSearchParams();
  const code = search.get("code") ?? "—";
  const label = search.get("label") ?? "";
  const name = search.get("name") ?? "";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-4 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLockup className="self-center" size="lg" />
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">You&apos;re checked in</CardTitle>
            <CardDescription>
              {name ? `${name} · ` : ""}Code {code}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            {label ? (
              <p className="text-sm text-muted-foreground">{label}</p>
            ) : null}
            <Button render={<Link href="/join" />} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function JoinDonePage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-svh items-center justify-center bg-muted text-sm text-muted-foreground">
          Loading…
        </p>
      }
    >
      <DoneBody />
    </Suspense>
  );
}
