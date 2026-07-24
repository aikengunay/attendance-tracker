"use client";

import { useEffect, useState } from "react";

/** Page pad (`p-4` × 2) — same budget as QR ticket. */
const PAGE_PAD_X = 32;
const MAX_CONTENT = 384;

export type ConfirmIdentityScale = {
  emojiSize: number;
  /** Tailwind text size classes for the legal name */
  nameClass: string;
  idClass: string;
};

function nameLengthBucket(name: string): "short" | "medium" | "long" {
  const n = name.trim().length;
  if (n <= 22) return "short";
  if (n <= 34) return "medium";
  return "long";
}

function scaleFor(viewportWidth: number, name: string): ConfirmIdentityScale {
  const column = Math.min(MAX_CONTENT, viewportWidth - PAGE_PAD_X);
  const narrow = column < 340;
  const bucket = nameLengthBucket(name);

  const emojiSize = narrow ? 96 : 120;

  // Length step-down first; narrow phones drop one more step.
  let nameClass =
    bucket === "short"
      ? "text-2xl sm:text-3xl"
      : bucket === "medium"
        ? "text-xl sm:text-2xl"
        : "text-lg sm:text-xl";

  if (narrow) {
    nameClass =
      bucket === "short"
        ? "text-xl"
        : bucket === "medium"
          ? "text-lg"
          : "text-base";
  }

  const idClass = narrow ? "text-sm" : "text-base sm:text-lg";

  return { emojiSize, nameClass, idClass };
}

/** Confirm identity type + emoji size for long names and narrow phones. */
export function useConfirmIdentityScale(name: string): ConfirmIdentityScale {
  const [scale, setScale] = useState<ConfirmIdentityScale>(() =>
    scaleFor(typeof window === "undefined" ? 390 : window.innerWidth, name),
  );

  useEffect(() => {
    const update = () => setScale(scaleFor(window.innerWidth, name));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [name]);

  return scale;
}
