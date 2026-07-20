"use client";

import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode";
import { useEffect, useId, useRef, useState } from "react";

type Props = {
  /** Preserve identity fields when applying a scanned token. */
  sectionCode?: string;
  studentId?: string;
  name?: string;
  /** Stay on confirm after scan when identity is already verified. */
  resumeConfirm?: boolean;
};

type ParseOk = { token: string; sectionCode?: string };

function parseQrPayload(raw: string): ParseOk | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const token = url.searchParams.get("token")?.trim();
    if (!token) return null;
    const sectionCode = url.searchParams.get("sectionCode")?.trim();
    return {
      token,
      sectionCode: sectionCode || undefined,
    };
  } catch {
    // Projector fallback code (opaque token string)
    if (/^[A-Za-z0-9_-]{8,}$/.test(text)) {
      return { token: text };
    }
    return null;
  }
}

function applyScan(parsed: ParseOk, preserve: Props) {
  const params = new URLSearchParams();
  params.set("token", parsed.token);
  const section = (
    parsed.sectionCode ??
    preserve.sectionCode ??
    ""
  ).toUpperCase();
  if (section) params.set("sectionCode", section);
  if (preserve.studentId) params.set("studentId", preserve.studentId);
  if (
    preserve.resumeConfirm &&
    preserve.name &&
    preserve.studentId &&
    section
  ) {
    params.set("step", "confirm");
    params.set("name", preserve.name);
  }
  window.location.assign(`/join?${params.toString()}`);
}

export function JoinQrScanner({
  sectionCode,
  studentId,
  name,
  resumeConfirm,
}: Props) {
  const regionId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setBusy(true);
    setMessage(null);

    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    const onSuccess = (decoded: string, _result: Html5QrcodeResult) => {
      if (handledRef.current) return;
      const parsed = parseQrPayload(decoded);
      if (!parsed) {
        setMessage("That QR is not a check-in code. Point at the projector QR.");
        return;
      }
      handledRef.current = true;
      void scanner
        .stop()
        .catch(() => undefined)
        .finally(() => {
          scannerRef.current = null;
          applyScan(parsed, {
            sectionCode,
            studentId,
            name,
            resumeConfirm,
          });
        });
    };

    void scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        onSuccess,
        () => undefined,
      )
      .then(() => {
        setBusy(false);
        setMessage(null);
      })
      .catch((err: unknown) => {
        setBusy(false);
        const errName =
          err && typeof err === "object" && "name" in err
            ? String((err as { name?: string }).name)
            : "";
        const insecure =
          typeof window !== "undefined" && !window.isSecureContext;
        if (insecure) {
          setMessage(
            "In-app camera needs a secure context (HTTPS or localhost). On classroom HTTP LAN, use your phone’s Camera app on the projector QR, or type the fallback code.",
          );
        } else if (errName === "NotAllowedError") {
          setMessage(
            "Camera permission denied. Allow camera for this site, or use your phone’s Camera app / typed code.",
          );
        } else {
          setMessage(
            "Could not open the camera. Use your phone’s Camera app on the projector QR, or type the fallback code under it.",
          );
        }
        scannerRef.current = null;
        setOpen(false);
      });

    return () => {
      const active = scannerRef.current;
      scannerRef.current = null;
      if (active?.isScanning) {
        void active.stop().catch(() => undefined);
      }
    };
  }, [open, regionId, sectionCode, studentId, name, resumeConfirm]);

  function stop() {
    const active = scannerRef.current;
    setOpen(false);
    setBusy(false);
    if (active?.isScanning) {
      void active.stop().catch(() => undefined);
    }
    scannerRef.current = null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800">Scan projector QR</p>
        {open ? (
          <button
            type="button"
            onClick={stop}
            className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-800"
          >
            Stop camera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-10 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white"
          >
            Open camera
          </button>
        )}
      </div>
      <p className="text-xs leading-5 text-zinc-500">
        Or use the phone Camera app on the projector QR. Typed fallback code
        still works below if the scan fails.
      </p>
      {message ? (
        <p className="rounded-md bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-900">
          {message}
        </p>
      ) : null}
      {open ? (
        <div className="overflow-hidden rounded-md bg-black">
          <div id={regionId} className="min-h-[220px] w-full" />
          {busy ? (
            <p className="bg-zinc-900 px-2 py-1 text-center text-xs text-zinc-300">
              Starting camera…
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
