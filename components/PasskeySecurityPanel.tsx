"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { enrollTeacherPasskey } from "@/lib/passkey-client";
import { useCallback, useEffect, useState } from "react";

type PasskeyRow = {
  id: string;
  label: string | null;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
};

type Support = "checking" | "yes" | "no";

const SKIP_KEY = "presentpo.passkey.enroll.skip";

export function PasskeySecurityPanel({
  autoPrompt = false,
}: {
  /** After first password login: open enroll offer if none exist. */
  autoPrompt?: boolean;
}) {
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [support, setSupport] = useState<Support>("checking");
  const [showOffer, setShowOffer] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/teacher/webauthn/passkeys");
    if (!res.ok) return [];
    const data = await res.json();
    const list = (data.passkeys ?? []) as PasskeyRow[];
    setPasskeys(list);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hasApi =
        typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined";
      if (!hasApi) {
        if (!cancelled) setSupport("no");
        return;
      }
      if (!cancelled) setSupport("yes");
      const list = await load();
      if (cancelled) return;
      if (autoPrompt && list.length === 0) {
        const skipped =
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem(SKIP_KEY) === "1";
        if (!skipped) setShowOffer(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, autoPrompt]);

  async function addPasskey() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await enrollTeacherPasskey();
      await load();
      setShowOffer(false);
      setSuccess(
        "Passkey enrolled. Next visit you can sign in with it from the login page.",
      );
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError(
          "Cancelled or blocked. Stay on http://localhost:3000 (not 127.0.0.1) and try again.",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Passkey registration failed",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(id: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/teacher/webauthn/passkeys/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Could not remove passkey");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  function dismissOffer() {
    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowOffer(false);
  }

  if (support === "checking") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>Checking passkey support…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (support === "no") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Passkeys</CardTitle>
          <CardDescription>
            This browser does not expose WebAuthn. Try Chrome or Safari, or keep
            using password.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Dialog
        open={showOffer}
        onOpenChange={(open) => {
          if (!open) dismissOffer();
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Set up a passkey?</DialogTitle>
            <DialogDescription>
              Next time you can unlock with Face ID / Touch ID from the login
              page — password stays as a backup.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={dismissOffer}
              disabled={busy}
            >
              Not now
            </Button>
            <Button type="button" onClick={addPasskey} disabled={busy}>
              {busy ? "Waiting for device…" : "Set up passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Manage devices that can unlock teacher access. Password always
              remains a backup. If passkey sign-in fails, remove old keys and
              add a new one.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addPasskey}
            disabled={busy}
            className="shrink-0"
          >
            {busy ? "Waiting…" : "Add passkey"}
          </Button>
        </CardHeader>
        <CardContent>
          {error && !showOffer ? (
            <p className="mb-3 text-sm text-destructive">{error}</p>
          ) : null}
          {success ? (
            <p className="mb-3 text-sm text-emerald-700">{success}</p>
          ) : null}

          {passkeys.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
              No passkeys yet.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {passkeys.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {p.label || p.deviceType || "Passkey"}
                      {p.backedUp ? " · synced" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="text-destructive"
                    onClick={() => removePasskey(p.id)}
                    disabled={busy}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
