import { afterEach, describe, expect, it } from "vitest";
import {
  clearAllJoinTickets,
  clearJoinTicket,
  loadJoinTicket,
  saveJoinTicket,
} from "@/lib/join-ticket-storage";

function mockSessionStorage() {
  const map = new Map<string, string>();
  const storage = {
    get length() {
      return map.size;
    },
    key(i: number) {
      return [...map.keys()][i] ?? null;
    },
    getItem(k: string) {
      return map.has(k) ? map.get(k)! : null;
    },
    setItem(k: string, v: string) {
      map.set(k, v);
    },
    removeItem(k: string) {
      map.delete(k);
    },
    clear() {
      map.clear();
    },
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    value: storage,
    configurable: true,
  });
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
  return map;
}

afterEach(() => {
  clearAllJoinTickets();
});

describe("join-ticket-storage", () => {
  it("saves, loads, and clears by section + student", () => {
    mockSessionStorage();
    saveJoinTicket("inf191", "2021-12345", {
      token: "abcTOKEN123",
      expiresAt: "2026-07-24T12:00:00.000Z",
    });
    expect(loadJoinTicket("INF191", "2021-12345")).toEqual({
      token: "abcTOKEN123",
      expiresAt: "2026-07-24T12:00:00.000Z",
    });
    clearJoinTicket("INF191", "2021-12345");
    expect(loadJoinTicket("INF191", "2021-12345")).toBeNull();
  });

  it("clearAllJoinTickets removes only ticket keys", () => {
    const map = mockSessionStorage();
    map.set("other.key", "keep");
    saveJoinTicket("A", "1", {
      token: "t1",
      expiresAt: "2026-07-24T12:00:00.000Z",
    });
    saveJoinTicket("B", "2", {
      token: "t2",
      expiresAt: "2026-07-24T12:00:00.000Z",
    });
    clearAllJoinTickets();
    expect(loadJoinTicket("A", "1")).toBeNull();
    expect(loadJoinTicket("B", "2")).toBeNull();
    expect(map.get("other.key")).toBe("keep");
  });
});
