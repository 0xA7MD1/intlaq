"use client";

import { useSyncExternalStore } from "react";
import {
  getDashboardCacheKey,
  safeParseDashboardCacheRaw,
  type DashboardCacheValueV1,
} from "@/lib/dashboard-cache";

function subscribe(userId: string, onStoreChange: () => void) {
  const key = getDashboardCacheKey(userId);

  const onStorage = (e: StorageEvent) => {
    if (e.key === key) onStoreChange();
  };

  const onLocalUpdate = (e: Event) => {
    const detail = (e as CustomEvent<{ userId?: string }>).detail;
    if (detail?.userId === userId) onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("intlaq:dashboard-cache-updated", onLocalUpdate);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("intlaq:dashboard-cache-updated", onLocalUpdate);
  };
}

type SnapshotCacheEntry = {
  raw: string | null;
  parsed: DashboardCacheValueV1 | null;
};

const snapshotCache = new Map<string, SnapshotCacheEntry>();

/*
useSyncExternalStore requires `getSnapshot` to return a stable reference.
We cache the last `localStorage` string per userId and only re-parse when the raw value changes.
*/
export function readDashboardCacheSnapshotCached(userId: string): DashboardCacheValueV1 | null {
  if (typeof window === "undefined") return null;
  const key = getDashboardCacheKey(userId);

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }

  const cached = snapshotCache.get(userId);
  if (cached && cached.raw === raw) return cached.parsed;

  const parsed = raw ? safeParseDashboardCacheRaw(raw, userId) : null;
  snapshotCache.set(userId, { raw, parsed });
  return parsed;
}

export function useDashboardCache(userId: string | null): DashboardCacheValueV1 | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined" || !userId) return () => {};
      return subscribe(userId, onStoreChange);
    },
    () => {
      if (typeof window === "undefined" || !userId) return null;
      return readDashboardCacheSnapshotCached(userId);
    },
    () => null
  );
}
