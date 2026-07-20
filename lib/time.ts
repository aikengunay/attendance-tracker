const TZ = "Asia/Manila";

/** Today's calendar date in Asia/Manila as YYYY-MM-DD. */
export function manilaDateString(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Combine Manila calendar date + HH:MM into a Date (UTC instant). */
export function manilaDateTime(dateYmd: string, timeHHMM: string): Date {
  return new Date(`${dateYmd}T${timeHHMM}:00+08:00`);
}

export function qrRotateSeconds(): number {
  const n = Number(process.env.QR_ROTATE_SECONDS ?? 20);
  return Number.isFinite(n) && n >= 5 ? n : 20;
}

export function earlyCheckInMinutes(): number {
  const n = Number(process.env.EARLY_CHECKIN_MINUTES ?? 15);
  return Number.isFinite(n) && n >= 0 ? n : 15;
}
