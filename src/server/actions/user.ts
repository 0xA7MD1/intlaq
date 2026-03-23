"use server";


import { db } from "@/server/db"; 
import { user, weightHistory } from "@/server/db/schema"; 
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import type { UserData } from "@/types";
import {
  calculateDailyCalories,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/server/utils/calorie";

function isActivityLevel(value: unknown): value is ActivityLevel {
  return (
    value === "sedentary" ||
    value === "light" ||
    value === "moderate" ||
    value === "active" ||
    value === "very_active"
  );
}

function isGoal(value: unknown): value is Goal {
  return value === "maintain" || value === "cut" || value === "bulk";
}

function isSex(value: unknown): value is Sex {
  return value === "male" || value === "female";
}

function assertFiniteNumber(name: string, value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${name}`);
  }
}

function assertNumberInRange(name: string, value: number, min: number, max: number) {
  if (value < min || value > max) {
    throw new Error(`Invalid ${name}`);
  }
}

// نحدد هنا أن الدالة تقبل فقط هذه الحقول الأربعة
export async function completeOnboarding(
  payload: Pick<UserData, 'gender' | 'age' | 'height' | 'weight' | 'activityLevel' | 'goal'>
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("غير مصرح لك");

  if (!isSex(payload.gender)) throw new Error("Invalid gender");
  if (!isActivityLevel(payload.activityLevel)) throw new Error("Invalid activity level");

  const goal: Goal = isGoal(payload.goal) ? payload.goal : "maintain";

  assertFiniteNumber("age", payload.age);
  assertFiniteNumber("height", payload.height);
  assertFiniteNumber("weight", payload.weight);

  assertNumberInRange("age", payload.age, 10, 100);
  assertNumberInRange("height", payload.height, 50, 250);
  assertNumberInRange("weight", payload.weight, 30, 300);

  let calc;
  try {
    calc = calculateDailyCalories({
      sex: payload.gender,
      age: payload.age,
      heightCm: payload.height,
      weightKg: payload.weight,
      activityLevel: payload.activityLevel,
      goal,
      formula: "mifflin",
    });
  } catch {
    throw new Error("Calorie calculation failed");
  }

  await db
    .update(user)
    .set({
      gender: payload.gender,
      age: payload.age,
      height: payload.height,
      weight: payload.weight,
      onboardingCompleted: true, // تحديث الحالة لاجتياز الـ Guard
      updatedAt: new Date(),
      activityLevel: payload.activityLevel,
      goal,

      bmr: calc.bmr,
      tdee: calc.tdee,
      dailyCalorieTarget: calc.dailyCalories,
      calorieTargetFormula: calc.formula,
      calorieTargetCalculatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  revalidateTag(`user-profile-${session.user.id}`, "default");
  revalidateTag(`dashboard-stats-${session.user.id}`, "default");

  return { success: true, dailyCalorieTarget: calc.dailyCalories };
}

export async function getOnboardingStatus() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("غير مصرح لك");

  const rows = await db
    .select({ onboardingCompleted: user.onboardingCompleted })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return { onboardingCompleted: rows[0]?.onboardingCompleted === true };
}

export async function getUserProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  return await unstable_cache(
    async () => {
      const rows = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      return rows[0];
    },
    [`user-profile-${userId}`],
    {
      tags: [`user-profile-${userId}`],
      revalidate: 3600,
    }
  )();
}

export async function updateUserProfile(payload: Partial<UserData>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("غير مصرح لك");

  const userId = session.user.id;
  const currentUser = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!currentUser) throw new Error("المستخدم غير موجود");

  const name = payload.name ?? currentUser.name;
  const gender = (payload.gender || currentUser.gender) as Sex;
  const age = payload.age ?? currentUser.age;
  const height = payload.height ?? currentUser.height;
  const weight = payload.weight ?? currentUser.weight;
  const activityLevel = (payload.activityLevel || currentUser.activityLevel) as ActivityLevel;
  const goal = (payload.goal || currentUser.goal) as Goal;

  if (age === null || height === null || weight === null) {
    throw new Error("بيانات غير مكتملة");
  }

  const calc = calculateDailyCalories({
    sex: gender,
    age: age,
    heightCm: height,
    weightKg: weight,
    activityLevel: activityLevel,
    goal: goal,
    formula: "mifflin",
  });

  // تحديث بيانات المستخدم في جدول user
  await db
    .update(user)
    .set({
      name,
      gender,
      age,
      height,
      weight,
      activityLevel,
      goal,
      bmr: calc.bmr,
      tdee: calc.tdee,
      dailyCalorieTarget: calc.dailyCalories,
      calorieTargetFormula: calc.formula,
      calorieTargetCalculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  revalidateTag(`user-profile-${userId}`, "default");
  revalidateTag(`dashboard-stats-${userId}`, "default");
  revalidateTag(`weight-history-${userId}`, "default");

  // إذا تغير الوزن، نقوم بإضافته لسجل الوزن لليوم الحالي
  if (weight !== currentUser.weight) {
    const today = new Date().toISOString().slice(0, 10);
    
    // التحقق إذا كان هناك سجل لهذا اليوم بالفعل
    const existingEntry = await db
      .select()
      .from(weightHistory)
      .where(and(eq(weightHistory.userId, userId), eq(weightHistory.date, today)))
      .limit(1)
      .then((rows) => rows[0]);

    if (existingEntry) {
      await db
        .update(weightHistory)
        .set({ weight, createdAt: new Date() })
        .where(eq(weightHistory.id, existingEntry.id));
    } else {
      await db.insert(weightHistory).values({
        id: crypto.randomUUID(),
        userId,
        weight,
        date: today,
        createdAt: new Date(),
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { success: true, dailyCalorieTarget: calc.dailyCalories };
}

export async function deleteWeightHistory() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("غير مصرح لك");

  await db.delete(weightHistory).where(eq(weightHistory.userId, session.user.id));

  return { success: true };
}

export async function getWeightHistory() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("غير مصرح لك");

  const userId = session.user.id;

  return await unstable_cache(
    async () => {
      const rows = await db
        .select({
          day: weightHistory.date,
          weight: weightHistory.weight,
        })
        .from(weightHistory)
        .where(eq(weightHistory.userId, userId))
        .orderBy(weightHistory.date);

      return rows;
    },
    [`weight-history-${userId}`],
    {
      tags: [`weight-history-${userId}`],
      revalidate: 3600,
    }
  )();
}
