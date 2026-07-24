import { describe, expect, it } from "vitest";
import { classWindowForMeeting, manilaDateTime } from "@/lib/time";

describe("classWindowForMeeting", () => {
  it("prefers template times on the meeting calendar day", () => {
    const date = manilaDateTime("2026-07-24", "00:00");
    const window = classWindowForMeeting({
      date,
      // Retake junk: evening open, afternoon scheduled end
      startAt: manilaDateTime("2026-07-24", "19:51"),
      endAt: manilaDateTime("2026-07-24", "15:40"),
      template: { startTime: "13:00", endTime: "15:40" },
    });
    expect(window.start.toISOString()).toBe(
      manilaDateTime("2026-07-24", "13:00").toISOString(),
    );
    expect(window.end.toISOString()).toBe(
      manilaDateTime("2026-07-24", "15:40").toISOString(),
    );
  });

  it("falls back to stored range when coherent and no template", () => {
    const start = manilaDateTime("2026-07-24", "10:00");
    const end = manilaDateTime("2026-07-24", "12:00");
    const window = classWindowForMeeting({
      date: manilaDateTime("2026-07-24", "00:00"),
      startAt: start,
      endAt: end,
      template: null,
    });
    expect(window.start).toEqual(start);
    expect(window.end).toEqual(end);
  });

  it("repairs incoherent stored range without template", () => {
    const window = classWindowForMeeting({
      date: manilaDateTime("2026-07-24", "00:00"),
      startAt: manilaDateTime("2026-07-24", "19:51"),
      endAt: manilaDateTime("2026-07-24", "15:40"),
      template: null,
    });
    expect(window.end.toISOString()).toBe(
      manilaDateTime("2026-07-24", "15:40").toISOString(),
    );
    expect(window.start.getTime()).toBeLessThan(window.end.getTime());
  });
});
