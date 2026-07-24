/** Student-facing check-in copy (conversational points + short status). */

export type AttendanceCode = 1 | 2 | 3 | 4;

type StatusCopy = {
  /** Quality weight from Excel attendance rules */
  points: number;
  /** Conversational reward line */
  pointsLine: string;
  /** Short status under the encourage line */
  detail: string;
  /** Teacher-oriented label */
  teacherLabel: string;
  /** Vendored Fluent animated emoji (APNG) */
  fluentSrc: string;
  /**
   * Encourage pool — pick one deterministically per student.
   * Use `{name}` for first name; omit variants without it when name is missing.
   */
  encourage: string[];
};

export const STUDENT_STATUS: Record<AttendanceCode, StatusCopy> = {
  1: {
    points: 1,
    pointsLine: "You got 1 point",
    detail: "On time",
    teacherLabel: "Present / on time (or under 15 min late)",
    fluentSrc: "/emoji/code-1.png",
    encourage: [
      "Nice one, {name}.",
      "Right on time, {name}.",
      "You're locked in, {name}.",
      "Clean check-in, {name}.",
      "That's the way, {name}.",
    ],
  },
  2: {
    points: 0.75,
    pointsLine: "You got 0.75 points",
    detail: "Late 15–30 mins",
    teacherLabel: "Late 15–30 min",
    fluentSrc: "/emoji/code-2.png",
    encourage: [
      "Still counts, {name}. Next time, aim for the start.",
      "You're in, {name}. Next time, a bit earlier.",
      "Made it, {name}. Shoot for on time next class.",
      "All good, {name}. Try catching the opening next time.",
    ],
  },
  3: {
    points: 0.69,
    pointsLine: "You got 0.69 points",
    detail: "Late 30–60 mins",
    teacherLabel: "Late 30–60 min",
    fluentSrc: "/emoji/code-3.png",
    encourage: [
      "Glad you made it, {name}. Next class, come in earlier.",
      "You're here, {name}. Let's try closer to the start next time.",
      "Thanks for coming, {name}. Aim for earlier next meeting.",
      "Still counted, {name}. Next time, beat the half-hour mark.",
    ],
  },
  4: {
    points: 0.63,
    pointsLine: "You got 0.63 points",
    detail: "Late 60+ mins",
    teacherLabel: "Late 60+ min",
    fluentSrc: "/emoji/code-4.png",
    encourage: [
      "You're here, {name}. That matters. Next time, be on time.",
      "Glad you showed up, {name}. Next time, be on time.",
      "You made it, {name}. Next class, start with everyone.",
      "Checked in, {name}. Next time, be on time.",
    ],
  },
};

const FALLBACK_ENCOURAGE: Record<AttendanceCode, string[]> = {
  1: [
    "Nice. You're locked in.",
    "Right on time.",
    "Clean check-in.",
  ],
  2: [
    "Still counts. Next time, aim for the start.",
    "You're in. Next time, a bit earlier.",
    "Made it. Shoot for on time next class.",
  ],
  3: [
    "Glad you made it. Next class, come in earlier.",
    "You're here. Let's try closer to the start next time.",
    "Thanks for coming. Aim for earlier next meeting.",
  ],
  4: [
    "You're here. That matters. Next time, be on time.",
    "Glad you showed up. Next time, be on time.",
    "You made it. Next class, start with everyone.",
  ],
};

/** Parse "LAST, FIRST MIDDLE" or "FIRST LAST" into a display first name. */
export function firstNameFromStudentName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const raw = trimmed.includes(",")
    ? (trimmed.split(",")[1]?.trim().split(/\s+/)[0] ?? "")
    : (trimmed.split(/\s+/)[0] ?? "");

  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function hashPick(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : h % modulo;
}

/** Deterministic encourage line from code + student identity (stable per person). */
export function encourageLineFor(
  code: AttendanceCode,
  fullName: string,
  seedExtra = "",
): string {
  const first = firstNameFromStudentName(fullName);
  const pool = first
    ? STUDENT_STATUS[code].encourage
    : FALLBACK_ENCOURAGE[code];
  const seed = `${code}|${fullName.trim().toUpperCase()}|${seedExtra}`;
  const template = pool[hashPick(seed, pool.length)] ?? pool[0]!;
  return first ? template.replaceAll("{name}", first) : template;
}

export function parseAttendanceCode(
  raw: string | number | null | undefined,
): AttendanceCode | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return null;
}

export function studentStatusFor(code: AttendanceCode) {
  return STUDENT_STATUS[code];
}
