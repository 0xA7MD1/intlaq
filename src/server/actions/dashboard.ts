"use server";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { calorieEntry, user } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export type DashboardSnapshot = {
  profile: {
    name: string | null;
    dailyCalorieTarget: number | null;
    userUpdatedAt: string | null;
  };
  today: {
    date: string;
    totalCalories: number;
  };
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const userId = session.user.id;

  return await unstable_cache(
    async () => {
      const profileRow = await db
        .select({
          name: user.name,
          dailyCalorieTarget: user.dailyCalorieTarget,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)
        .then((rows) => rows[0]);

      const date = getTodayDateString();
      const totals = await db
        .select({
          totalCalories: sql<number>`coalesce(sum(${calorieEntry.calories}), 0)`
            .mapWith(Number)
            .as("totalCalories"),
        })
        .from(calorieEntry)
        .where(and(eq(calorieEntry.userId, userId), eq(calorieEntry.date, date)));

      return {
        profile: {
          name: profileRow?.name ?? null,
          dailyCalorieTarget: profileRow?.dailyCalorieTarget ?? null,
          userUpdatedAt: profileRow?.updatedAt ? profileRow.updatedAt.toISOString() : null,
        },
        today: {
          date,
          totalCalories: totals[0]?.totalCalories ?? 0,
        },
      };
    },
    [`dashboard-snapshot-${userId}`],
    {
      tags: [`dashboard-stats-${userId}`, `user-profile-${userId}`],
      revalidate: 3600, // fallback revalidate
    }
  )();
}

