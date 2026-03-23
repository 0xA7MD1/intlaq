import { describe, expect, it } from "vitest";
import { consumeFixedWindow } from "@/lib/rate-limit";

describe("consumeFixedWindow", () => {
  it("allows up to limit within window and blocks after", () => {
    const store = new Map();
    const key = "k";
    const now = 1000;

    const r1 = consumeFixedWindow({ store, key, limit: 2, windowMs: 60_000, now });
    const r2 = consumeFixedWindow({ store, key, limit: 2, windowMs: 60_000, now });
    const r3 = consumeFixedWindow({ store, key, limit: 2, windowMs: 60_000, now });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after window expires", () => {
    const store = new Map();
    const key = "k";

    const now = 1000;
    consumeFixedWindow({ store, key, limit: 1, windowMs: 10, now });
    const blocked = consumeFixedWindow({ store, key, limit: 1, windowMs: 10, now });
    expect(blocked.allowed).toBe(false);

    const after = consumeFixedWindow({ store, key, limit: 1, windowMs: 10, now: now + 11 });
    expect(after.allowed).toBe(true);
  });
});

