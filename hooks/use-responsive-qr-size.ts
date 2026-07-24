"use client";

import { useEffect, useState } from "react";

const FULL_QR = 240;
const FULL_PAD = 20;
/** Soft floor — may go lower if needed to keep page pad. */
const MIN_QR = 160;
const PAD_RATIO = FULL_PAD / FULL_QR;
/** Horizontal page pad (`p-4` = 16×2). */
const PAGE_PAD_X = 32;
/** Ticket column cap (`max-w-sm`). */
const MAX_CONTENT = 384;

export type QrTileMetrics = {
  size: number;
  padding: number;
  radius: number;
};

function metricsForWidth(viewportWidth: number): QrTileMetrics {
  const column = Math.min(MAX_CONTENT, viewportWidth - PAGE_PAD_X);
  const fullTile = FULL_QR + 2 * FULL_PAD;

  // Comfortable width: keep the original 240 / p-5 look.
  if (column >= fullTile) {
    return { size: FULL_QR, padding: FULL_PAD, radius: FULL_PAD };
  }

  // ~300px and below: shrink QR and thin the white matte so page pad stays 16px.
  let size = Math.floor(column / (1 + 2 * PAD_RATIO));
  size = Math.min(FULL_QR, Math.max(MIN_QR, size));
  let padding = Math.max(10, Math.round(size * PAD_RATIO));
  if (size + 2 * padding > column) {
    size = Math.floor(column / (1 + 2 * PAD_RATIO));
    padding = Math.max(8, Math.round(size * PAD_RATIO));
  }

  return {
    size,
    padding,
    radius: Math.max(10, Math.round(padding)),
  };
}

/** QR + tile pad that always fit inside the join column (honors 16px page pad). */
export function useResponsiveQrTile(): QrTileMetrics {
  const [metrics, setMetrics] = useState<QrTileMetrics>(() =>
    metricsForWidth(typeof window === "undefined" ? 390 : window.innerWidth),
  );

  useEffect(() => {
    const update = () => setMetrics(metricsForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return metrics;
}
