import { describe, expect, it } from "vitest";
import { readDashboardCacheSnapshotCached } from "@/lib/use-dashboard-cache";
import { getDashboardCacheKey, safeWriteDashboardCache } from "@/lib/dashboard-cache";

function installLocalStorageMock() {
  const store = new Map<string, string>();

  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  } as unknown as Storage;

  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageMock },
    configurable: true,
  });

  return { store };
}

describe("readDashboardCacheSnapshotCached", () => {
  it("returns same reference when localStorage string does not change", () => {
    installLocalStorageMock();

    const userId = "user-1";
    safeWriteDashboardCache(userId, {
      profile: { name: "A", dailyCalorieTarget: 2000, userUpdatedAt: "2026-01-19T00:00:00.000Z" },
      today: { date: "2026-01-19", totalCalories: 500 },
    });

    const a = readDashboardCacheSnapshotCached(userId);
    const b = readDashboardCacheSnapshotCached(userId);

    expect(a).not.toBeNull();
    expect(a).toBe(b);
  });

  it("returns new reference when localStorage string changes", () => {
    installLocalStorageMock();

    const userId = "user-2";
    safeWriteDashboardCache(userId, {
      profile: { name: "B", dailyCalorieTarget: 2000, userUpdatedAt: "2026-01-19T00:00:00.000Z" },
      today: { date: "2026-01-19", totalCalories: 500 },
    });
    const a = readDashboardCacheSnapshotCached(userId);

    const key = getDashboardCacheKey(userId);
    const raw = window.localStorage.getItem(key);
    expect(raw).not.toBeNull();
    window.localStorage.setItem(key, String(raw).replace("500", "600"));

    const b = readDashboardCacheSnapshotCached(userId);
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a).not.toBe(b);
  });
});

