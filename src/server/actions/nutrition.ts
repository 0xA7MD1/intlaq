"use server";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { meals, user } from "@/server/db/schema";
import { and, eq, gte, lt } from "drizzle-orm";
import { headers } from "next/headers";

function getTodayBoundsUTC(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function safeNum(v: unknown, def: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return def;
}

/** أهداف الماكرو التقريبية من السعرات (نسبة: بروتين 30%، كارب 40%، دهون 30%) */
function macroTargetsFromCalories(cal: number): { protein: number; carbs: number; fat: number } {
  if (!Number.isFinite(cal) || cal <= 0)
    return { protein: 150, carbs: 250, fat: 70 };
  return {
    protein: Math.round((0.3 * cal) / 4),
    carbs: Math.round((0.4 * cal) / 4),
    fat: Math.round((0.3 * cal) / 9),
  };
}

export type TodayNutritionSummary = {
  dailyCalorieTarget: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsCount: number;
  /** أهداف الماكرو (مشتقة من الهدف اليومي إن وُجد) */
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
};

export async function getTodayNutritionSummary(): Promise<TodayNutritionSummary> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      dailyCalorieTarget: null,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealsCount: 0,
      targetProtein: 150,
      targetCarbs: 250,
      targetFat: 70,
    };
  }

  const { start, end } = getTodayBoundsUTC();

  const [profileRow] = await db
    .select({ dailyCalorieTarget: user.dailyCalorieTarget })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const todayMeals = await db
    .select({
      aiAnalysis: meals.aiAnalysis,
    })
    .from(meals)
    .where(
      and(
        eq(meals.userId, session.user.id),
        gte(meals.createdAt, start),
        lt(meals.createdAt, end)
      )
    );

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const row of todayMeals) {
    const analysis = row.aiAnalysis as Record<string, unknown> | null;
    const parsed = analysis?.parsed as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") continue;
    calories += safeNum(parsed.calories, 0);
    protein += safeNum(parsed.protein, 0);
    carbs += safeNum(parsed.carbs, 0);
    fat += safeNum(parsed.fat, 0);
  }

  const dailyCalorieTarget =
    typeof profileRow?.dailyCalorieTarget === "number" && Number.isFinite(profileRow.dailyCalorieTarget)
      ? profileRow.dailyCalorieTarget
      : null;

  const targets = dailyCalorieTarget
    ? macroTargetsFromCalories(dailyCalorieTarget)
    : { protein: 150, carbs: 250, fat: 70 };

  return {
    dailyCalorieTarget,
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    mealsCount: todayMeals.length,
    targetProtein: targets.protein,
    targetCarbs: targets.carbs,
    targetFat: targets.fat,
  };
}
