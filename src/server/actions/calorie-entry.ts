"use server";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { calorieEntry } from "@/server/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function assertFiniteNumber(name: string, value: unknown): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${name}`);
  }
}

function assertStringOrNull(name: string, value: unknown): asserts value is string | null | undefined {
  if (value === undefined || value === null) return;
  if (typeof value !== "string") throw new Error(`Invalid ${name}`);
}

export type AddCalorieEntryInput = {
  calories: number;
  note?: string | null;
  date?: string;
};

export type CalorieEntryRow = {
  id: string;
  calories: number;
  note: string | null;
  createdAt: Date;
};

export type TodayCalorieSummary = {
  date: string;
  totalCalories: number;
  entries: CalorieEntryRow[];
};

export async function addCalorieEntry(input: AddCalorieEntryInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  assertFiniteNumber("calories", input.calories);
  assertStringOrNull("note", input.note);

  if (input.calories < 1 || input.calories > 10000) {
    throw new Error("Invalid calories");
  }

  if (typeof input.note === "string" && input.note.length > 240) {
    throw new Error("Invalid note");
  }

  const date = typeof input.date === "string" ? input.date : getTodayDateString();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date");
  }

  const id = crypto.randomUUID();

  await db.insert(calorieEntry).values({
    id,
    userId: session.user.id,
    date,
    calories: Math.round(input.calories),
    note: input.note ?? null,
  });

  return { success: true };
}

export async function getTodayCalorieSummary(): Promise<TodayCalorieSummary> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const date = getTodayDateString();

  const totals = await db
    .select({
      totalCalories: sql<number>`coalesce(sum(${calorieEntry.calories}), 0)`
        .mapWith(Number)
        .as("totalCalories"),
    })
    .from(calorieEntry)
    .where(and(eq(calorieEntry.userId, session.user.id), eq(calorieEntry.date, date)));

  const entries = await db
    .select({
      id: calorieEntry.id,
      calories: calorieEntry.calories,
      note: calorieEntry.note,
      createdAt: calorieEntry.createdAt,
    })
    .from(calorieEntry)
    .where(and(eq(calorieEntry.userId, session.user.id), eq(calorieEntry.date, date)))
    .orderBy(desc(calorieEntry.createdAt));

  return {
    date,
    totalCalories: totals[0]?.totalCalories ?? 0,
    entries,
  };
}

