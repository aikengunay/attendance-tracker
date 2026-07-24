"use client";

import { StyledCheckInQr } from "@/components/StyledCheckInQr";
import { BorderBeam } from "border-beam";

const DEFAULT_SIZE = 240;
const DEFAULT_PAD = 20;

/** Shared lively border-beam pulse around the student check-in QR tile. */
export function PulsingQrTile({
  data,
  size = DEFAULT_SIZE,
  padding = DEFAULT_PAD,
  borderRadius = DEFAULT_PAD,
  className,
}: {
  data: string;
  size?: number;
  /** White matte around the QR — scale down with `size` on small phones. */
  padding?: number;
  borderRadius?: number;
  className?: string;
}) {
  return (
    <BorderBeam
      size="pulse-outside"
      colorVariant="ocean"
      theme="light"
      duration={1.85}
      strength={1}
      brightness={2.1}
      saturation={2.2}
      borderRadius={borderRadius}
      className={className}
    >
      <div
        className="bg-white"
        style={{
          padding,
          borderRadius,
          boxShadow:
            "0 4px 24px oklch(0.55 0.12 240 / 0.12), 0 1px 2px oklch(0 0 0 / 0.04)",
        }}
      >
        <StyledCheckInQr data={data} size={size} />
      </div>
    </BorderBeam>
  );
}
