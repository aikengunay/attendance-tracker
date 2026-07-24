"use client";

import { TICKET_REASSURE_LINES } from "@/lib/join-ticket-copy";
import { useEffect, useState } from "react";

const HOLD_MS = 4200;
const FADE_MS = 420;

/**
 * Soft rotating reassurance under the ticket identity.
 * Crossfades + slight rise; respects prefers-reduced-motion.
 */
export function TicketReassureLine() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;

    const cycle = () => {
      holdTimer = setTimeout(() => {
        if (cancelled) return;
        setPhase("out");
        fadeTimer = setTimeout(() => {
          if (cancelled) return;
          setIndex((i) => (i + 1) % TICKET_REASSURE_LINES.length);
          setPhase("in");
          cycle();
        }, FADE_MS);
      }, HOLD_MS);
    };

    cycle();
    return () => {
      cancelled = true;
      if (holdTimer) clearTimeout(holdTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [reduceMotion]);

  const line = TICKET_REASSURE_LINES[index] ?? TICKET_REASSURE_LINES[0];

  return (
    <p
      className="relative mx-auto min-h-[1.25rem] max-w-[18rem] text-center text-sm text-muted-foreground"
      aria-live="off"
    >
      <span
        className={
          reduceMotion
            ? "block"
            : phase === "in"
              ? "presentpo-ticket-reassure-in block"
              : "presentpo-ticket-reassure-out block"
        }
        style={reduceMotion ? undefined : { animationDuration: `${FADE_MS}ms` }}
      >
        {line}
      </span>
    </p>
  );
}
