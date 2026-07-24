const TZ = "Asia/Manila";

/** Today's calendar date in Asia/Manila as YYYY-MM-DD. */
export function manilaDateString(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Combine Manila calendar date + HH:MM into a Date (UTC instant). */
export function manilaDateTime(dateYmd: string, timeHHMM: string): Date {
  return new Date(`${dateYmd}T${timeHHMM}:00+08:00`);
}

type MeetingWindowInput = {
  date: Date;
  startAt: Date;
  endAt: Date;
  template?: { startTime: string; endTime: string } | null;
};

/**
 * Student/teacher-facing class window. Prefer template times on the meeting
 * date so retakes / t0=now never show nonsense like "7:51 PM – 3:40 PM".
 */
export function classWindowForMeeting(meeting: MeetingWindowInput): {
  start: Date;
  end: Date;
} {
  const tpl = meeting.template;
  if (tpl?.startTime && tpl?.endTime) {
    const ymd = manilaDateString(meeting.date);
    return {
      start: manilaDateTime(ymd, tpl.startTime),
      end: manilaDateTime(ymd, tpl.endTime),
    };
  }
  if (meeting.endAt.getTime() > meeting.startAt.getTime()) {
    return { start: meeting.startAt, end: meeting.endAt };
  }
  // Incoherent stored range (retake start=now, end=scheduled afternoon).
  // Anchor the end clock to the meeting calendar day; assume a 2h slot.
  const ymd = manilaDateString(meeting.date);
  const endHm = meeting.endAt.toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const end = manilaDateTime(ymd, endHm);
  return { start: new Date(end.getTime() - 2 * 60 * 60 * 1000), end };
}

export function qrRotateSeconds(): number {
  const n = Number(process.env.QR_ROTATE_SECONDS ?? 20);
  return Number.isFinite(n) && n >= 5 ? n : 20;
}

/** Personal student QR TTL (seconds). Default 10 minutes. */
export function personalTokenTtlSeconds(): number {
  const n = Number(process.env.PERSONAL_TOKEN_TTL_SECONDS ?? 600);
  return Number.isFinite(n) && n >= 60 ? n : 600;
}

export function earlyCheckInMinutes(): number {
  const n = Number(process.env.EARLY_CHECKIN_MINUTES ?? 15);
  return Number.isFinite(n) && n >= 0 ? n : 15;
}
