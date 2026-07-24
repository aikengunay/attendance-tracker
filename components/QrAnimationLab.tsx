"use client";

import { PulsingQrTile } from "@/components/PulsingQrTile";
import { StyledCheckInQr } from "@/components/StyledCheckInQr";
import { BrandLockup } from "@/components/teacher/brand-lockup";
import { BorderBeam } from "border-beam";
import Link from "next/link";
import dynamic from "next/dynamic";

const GlowCard = dynamic(
  () => import("glow-card/react").then((m) => m.GlowCard),
  { ssr: false },
);

/** Length matches production opaque tokens (~43 chars) for realistic module density. */
const DEMO_PAYLOAD =
  "lab-demo-opaque-token-not-real-xxxxxxxxxxxxxxxxx";

/** Match JoinConfirmTicket production QR size. */
const QR_SIZE = 240;

function QrFace({ size = QR_SIZE }: { size?: number }) {
  return <StyledCheckInQr data={DEMO_PAYLOAD} size={size} />;
}

function Sample({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border bg-background/60 p-6">
      <div className="w-full space-y-1 text-center sm:text-left">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-col items-center gap-4 py-2">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
          TUE, 24 JUL · 1:00–3:40 PM
        </p>
        {children}
        <div className="space-y-0.5 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide">
            Sample Student
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            2019-100265
          </p>
          <p className="pt-1 text-xs text-muted-foreground">
            Waiting for teacher to scan…
          </p>
        </div>
      </div>
    </section>
  );
}

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md">{children}</div>
  );
}

export function QrAnimationLab() {
  return (
    <div className="min-h-svh bg-muted px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <BrandLockup href="/" />
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              QR animation lab
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Compare waiting animations around the ticket QR. Demo payload only
              — not a live check-in token.
            </p>
          </div>
          <Link
            href="/join"
            className="text-sm underline underline-offset-4 hover:text-foreground"
          >
            Back to /join
          </Link>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Sample
            title="Current (production)"
            subtitle="p-5 · radius 20 · 240px QR — border-beam pulse-outside."
          >
            <PulsingQrTile data={DEMO_PAYLOAD} size={QR_SIZE} />
          </Sample>

          <Sample
            title="Legacy · Soft pulse + ring"
            subtitle="Previous CSS pulse + expanding ring."
          >
            <div className="relative flex items-center justify-center p-3">
              <div
                aria-hidden
                className="presentpo-qr-ring pointer-events-none absolute inset-2 rounded-2xl border-2 border-sky-400/40"
              />
              <div className="presentpo-qr-tile relative rounded-2xl bg-white p-4 shadow-md">
                <QrFace />
              </div>
            </div>
          </Sample>

          <Sample
            title="1 · Ring ping only"
            subtitle="Expanding/fading ring; QR tile stays still."
          >
            <div className="relative flex items-center justify-center p-4">
              <div
                aria-hidden
                className="presentpo-qr-ring pointer-events-none absolute inset-1 rounded-2xl border-2 border-sky-400/50"
              />
              <Tile>
                <QrFace />
              </Tile>
            </div>
          </Sample>

          <Sample
            title="2 · border-beam pulse (milder)"
            subtitle="Earlier milder settings for comparison."
          >
            <BorderBeam
              size="pulse-outside"
              colorVariant="ocean"
              theme="light"
              duration={2.4}
              strength={0.85}
              borderRadius={16}
            >
              <Tile>
                <QrFace />
              </Tile>
            </BorderBeam>
          </Sample>

          <Sample
            title="3 · glow-card pulse"
            subtitle="Soft aura via glow-card variant=pulse."
          >
            <GlowCard
              variant="pulse"
              color="#0ea5e9"
              intensity={0.9}
              radius={16}
              className="rounded-2xl bg-white p-4 shadow-md"
            >
              <QrFace />
            </GlowCard>
          </Sample>

          <Sample
            title="4 · Traveling border beam"
            subtitle="Light moves along the edge (flashier)."
          >
            <BorderBeam
              size="md"
              colorVariant="ocean"
              theme="light"
              duration={2.2}
              strength={0.9}
              borderRadius={16}
            >
              <Tile>
                <QrFace />
              </Tile>
            </BorderBeam>
          </Sample>
        </div>
      </div>
    </div>
  );
}
