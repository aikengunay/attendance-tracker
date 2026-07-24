/**
 * Same-meaning reassurance while the student holds their QR.
 * Not stage changes — never imply the teacher is “processing.”
 */
export const TICKET_REASSURE_LINES = [
  "Show this to your teacher",
  "Keep this screen bright",
  "Face the camera at the station",
  "Hold steady for the scan",
] as const;

/** Fluent APNG for “Is this you?” — recognition, not celebration. */
export const CONFIRM_FLUENT_SRC = "/emoji/confirm-raise.png";

/**
 * Optical nudge (px) so the emoji feels centered to the eye, not just the box.
 * Positive Y = move down; positive X = move right. Tweak here.
 */
export const CONFIRM_FLUENT_NUDGE = { x: -14.25, y: 4 } as const;
