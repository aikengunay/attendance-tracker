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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  authenticateTeacherPasskey,
  canAutoPasskey,
  noteAutoPasskeyShown,
} from "@/lib/passkey-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next") || "/teacher";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [allowAutoPasskey] = useState(() => canAutoPasskey());
  const nextRef = useRef(nextPath);
  nextRef.current = nextPath;

  function goNext() {
    const dest = nextRef.current.startsWith("/teacher")
      ? nextRef.current
      : "/teacher";
    router.replace(dest);
    router.refresh();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teacher/webauthn/status");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setHasPasskeys(Boolean(data.hasPasskeys));
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setStatusLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-offer passkey once per tab (skip logout landing + refresh)
  useEffect(() => {
    if (!statusLoaded || !hasPasskeys || !allowAutoPasskey) return;
    let cancelled = false;
    noteAutoPasskeyShown();

    (async () => {
      setPasskeyLoading(true);
      setError(null);
      try {
        await authenticateTeacherPasskey({ useBrowserAutofill: false });
        if (!cancelled) goNext();
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "NotAllowedError") return;
        setError(err instanceof Error ? err.message : "Passkey sign-in failed");
      } finally {
        if (!cancelled) setPasskeyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [statusLoaded, hasPasskeys, allowAutoPasskey]);

  async function signInWithPasskey() {
    if (passkeyLoading || loading) return;
    setPasskeyLoading(true);
    setError(null);
    try {
      await authenticateTeacherPasskey({ useBrowserAutofill: false });
      goNext();
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Passkey sign-in was cancelled");
        return;
      }
      setError(err instanceof Error ? err.message : "Passkey sign-in failed");
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Invalid password");
        return;
      }
      goNext();
    } finally {
      setLoading(false);
    }
  }

  const showPasskey = statusLoaded && hasPasskeys;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLockup className="self-center" size="lg" />

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              {showPasskey
                ? passkeyLoading
                  ? "Waiting for passkey…"
                  : "Enter your password, or use a passkey."
                : "Teacher access for attendance sessions."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={loading || passkeyLoading}
                className="w-full"
              >
                {loading ? "Signing in…" : "Continue"}
              </Button>
            </form>

            {showPasskey ? (
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground uppercase">
                    or
                  </span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => void signInWithPasskey()}
                  disabled={passkeyLoading || loading}
                >
                  {passkeyLoading
                    ? "Waiting for passkey…"
                    : "Sign in with passkey"}
                </Button>
              </div>
            ) : statusLoaded ? (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                First time here? After you continue, we’ll offer to set up a
                passkey.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function TeacherLoginPage() {
  return (
    <Suspense
      fallback={
        <p className="flex min-h-svh items-center justify-center bg-muted text-sm text-muted-foreground">
          Loading…
        </p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
