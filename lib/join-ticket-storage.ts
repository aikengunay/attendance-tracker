/** sessionStorage helpers for refresh-safe personal QR tickets (browser only). */

const PREFIX = "presentpo.ticket.";

export type StoredTicket = {
  token: string;
  expiresAt: string;
};

function storageKey(sectionCode: string, studentId: string): string {
  return `${PREFIX}${sectionCode.trim().toUpperCase()}|${studentId.trim()}`;
}

export function saveJoinTicket(
  sectionCode: string,
  studentId: string,
  ticket: StoredTicket,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      storageKey(sectionCode, studentId),
      JSON.stringify(ticket),
    );
  } catch {
    /* private mode / quota */
  }
}

export function loadJoinTicket(
  sectionCode: string,
  studentId: string,
): StoredTicket | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(sectionCode, studentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTicket;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearJoinTicket(sectionCode: string, studentId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(sectionCode, studentId));
  } catch {
    /* ignore */
  }
}

/** Clear any presentpo ticket keys (e.g. landing on done without ids). */
export function clearAllJoinTickets(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}
