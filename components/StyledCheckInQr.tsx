"use client";

import QRCodeStyling from "qr-code-styling";
import { useEffect, useRef } from "react";

const SKY = "#0284C7";
const SKY_SOFT = "#7DD3FC";

export function StyledCheckInQr({
  data,
  size = 240,
}: {
  data: string;
  size?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !data) return;

    host.replaceChildren();

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: "svg",
      data,
      image: "/brand/brand.png",
      margin: 8,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
      dotsOptions: {
        color: SKY,
        type: "dots",
      },
      cornersSquareOptions: {
        color: SKY,
        type: "extra-rounded",
      },
      cornersDotOptions: {
        color: SKY_SOFT,
        type: "dot",
      },
      backgroundOptions: {
        color: "#FFFFFF",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
        imageSize: 0.295,
        hideBackgroundDots: true,
      },
    });

    qr.append(host);

    return () => {
      host.replaceChildren();
    };
  }, [data, size]);

  return (
    <div
      ref={hostRef}
      className="flex items-center justify-center [&_svg]:size-full"
      style={{ width: size, height: size }}
      aria-label="Your check-in QR"
    />
  );
}
