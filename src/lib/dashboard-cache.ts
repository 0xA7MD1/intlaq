export type DashboardCacheProfile = {
  name: string | null;
  dailyCalorieTarget: number | null;
  userUpdatedAt: string | null;
};

export type DashboardCacheToday = {
  date: string;
  totalCalories: number;
};

export type DashboardCacheValueV1 = {
  version: 1;
  userId: string;
  storedAt: number;
  profile: DashboardCacheProfile;
  today: DashboardCacheToday;
};

const CACHE_PREFIX = "intlaq:dashboard:v1:";

/*
Caching strategy:
- Store a small dashboard snapshot in localStorage per-user (`intlaq:dashboard:v1:{userId}`).
- Read from cache on each page refresh to avoid calling the database every time.
- Revalidate only when the cache is missing, malformed, belongs to another user, is for a different day,
  or exceeds a short TTL (so progress stays reasonably fresh).
- When user profile or intake data changes, overwrite the cache and broadcast an in-tab event so widgets update.
*/

export function getDashboardCacheKey(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

export function safeReadDashboardCache(userId: string): DashboardCacheValueV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getDashboardCacheKey(userId));
    if (!raw) return null;
    return safeParseDashboardCacheRaw(raw, userId);
  } catch {
    return null;
  }
}

export function safeParseDashboardCacheRaw(raw: string, userId: string): DashboardCacheValueV1 | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDashboardCacheValueV1(parsed)) return null;
    if (parsed.userId !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function safeWriteDashboardCache(userId: string, value: Omit<DashboardCacheValueV1, "version" | "userId" | "storedAt">) {
  if (typeof window === "undefined") return;
  try {
    const payload: DashboardCacheValueV1 = {
      version: 1,
      userId,
      storedAt: Date.now(),
      profile: value.profile,
      today: value.today,
    };
    window.localStorage.setItem(getDashboardCacheKey(userId), JSON.stringify(payload));
    if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("intlaq:dashboard-cache-updated", { detail: { userId } }));
    }
  } catch {
    // Ignore cache write failures (private mode, disabled storage, quota exceeded).
  }
}

export function safeRemoveDashboardCache(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getDashboardCacheKey(userId));
    if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent("intlaq:dashboard-cache-updated", { detail: { userId } }));
    }
  } catch {
    // Ignore.
  }
}

export function shouldRevalidateDashboardCache(args: {
  cached: DashboardCacheValueV1 | null;
  todayDate: string;
  ttlMs: number;
}) {
  const { cached, todayDate, ttlMs } = args;
  if (!cached) return true;
  if (cached.version !== 1) return true;
  if (cached.today.date !== todayDate) return true;
  if (!Number.isFinite(cached.storedAt)) return true;
  if (Date.now() - cached.storedAt > ttlMs) return true;
  return false;
}

function isDashboardCacheValueV1(value: unknown): value is DashboardCacheValueV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return false;
  if (typeof v.userId !== "string") return false;
  if (typeof v.storedAt !== "number") return false;

  const profile = v.profile as Record<string, unknown> | undefined;
  if (!profile || typeof profile !== "object") return false;
  if (!(typeof profile.name === "string" || profile.name === null)) return false;
  if (!(typeof profile.dailyCalorieTarget === "number" || profile.dailyCalorieTarget === null)) return false;
  if (!(typeof profile.userUpdatedAt === "string" || profile.userUpdatedAt === null)) return false;

  const today = v.today as Record<string, unknown> | undefined;
  if (!today || typeof today !== "object") return false;
  if (typeof today.date !== "string") return false;
  if (typeof today.totalCalories !== "number") return false;

  return true;
}
