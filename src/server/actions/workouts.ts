"use server";

import { db } from "@/server/db";
import { workoutGroups, exercises, workoutLogs } from "@/server/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, between, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getWorkoutIcon } from "@/app/(dashboard)/dashboard/workout/lib/workout-icons";

/** Helper to get current user session */
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/** 
 * Get all workout groups for the current user,
 * including exercise counts and total duration.
 */
export async function getWorkoutGroups() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const groups = await db
    .select({
      id: workoutGroups.id,
      title: workoutGroups.title,
      icon: workoutGroups.icon,
      exercisesCount: sql<number>`count(${exercises.id})::int`,
      durationMinutes: sql<number>`COALESCE(sum(${exercises.durationSeconds}), 0)::int / 60`,
    })
    .from(workoutGroups)
    .leftJoin(exercises, eq(workoutGroups.id, exercises.groupId))
    .where(eq(workoutGroups.userId, session.user.id))
    .groupBy(workoutGroups.id);

  return groups;
}

/**
 * Create a new workout group
 */
export async function createWorkoutGroup({
  title,
  days = [],
  exercises: newExercises = [],
}: {
  title: string;
  days?: string[];
  exercises?: { title: string; sets: number; reps: number }[];
}) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  const icon = getWorkoutIcon(title);
  
  await db.transaction(async (tx) => {
    // Insert Group
    await tx.insert(workoutGroups).values({
      id,
      userId: session.user.id,
      title,
      icon,
      days,
    });

    // Insert Exercises if any
    if (newExercises.length > 0) {
      await tx.insert(exercises).values(
        newExercises.map((ex) => ({
          id: crypto.randomUUID(),
          groupId: id,
          title: ex.title,
          sets: ex.sets,
          reps: ex.reps,
        }))
      );
    }
  });

  revalidatePath("/dashboard/workout");
  return { success: true, id };
}

/**
 * Delete a workout group
 */
export async function deleteWorkoutGroup(id: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .delete(workoutGroups)
    .where(and(eq(workoutGroups.id, id), eq(workoutGroups.userId, session.user.id)));

  revalidatePath("/dashboard/workout");
  return { success: true };
}

/**
 * Log a workout for a specific date
 */
export async function logWorkout(groupId: string, date: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const id = crypto.randomUUID();

  await db.insert(workoutLogs).values({
    id,
    userId: session.user.id,
    groupId,
    date, // "YYYY-MM-DD"
    status: "completed",
  });

  revalidatePath("/dashboard/workout");
  return { success: true };
}

/**
 * Get workout logs between a date range
 */
export async function getWorkoutLogsByDateRange(startDate: string, endDate: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const logs = await db
    .select({
      id: workoutLogs.id,
      date: workoutLogs.date,
      status: workoutLogs.status,
      groupId: workoutLogs.groupId,
      groupTitle: workoutGroups.title,
    })
    .from(workoutLogs)
    .innerJoin(workoutGroups, eq(workoutLogs.groupId, workoutGroups.id))
    .where(
      and(
        eq(workoutLogs.userId, session.user.id),
        between(workoutLogs.date, startDate, endDate)
      )
    );

  return logs;
}

/**
 * Get all exercises for a specific workout group
 */
export async function getExercisesByGroup(groupId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify the group belongs to the user
  const group = await db
    .select({ id: workoutGroups.id })
    .from(workoutGroups)
    .where(and(eq(workoutGroups.id, groupId), eq(workoutGroups.userId, session.user.id)))
    .limit(1);

  if (group.length === 0) throw new Error("Group not found");

  const result = await db
    .select({
      id: exercises.id,
      title: exercises.title,
      sets: exercises.sets,
      reps: exercises.reps,
    })
    .from(exercises)
    .where(eq(exercises.groupId, groupId));

  return result;
}

/**
 * Update workout group title (and auto-update icon)
 */
export async function updateWorkoutGroupTitle(groupId: string, newTitle: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const icon = getWorkoutIcon(newTitle);

  await db
    .update(workoutGroups)
    .set({ title: newTitle, icon })
    .where(and(eq(workoutGroups.id, groupId), eq(workoutGroups.userId, session.user.id)));

  revalidatePath("/dashboard/workout");
  return { success: true };
}

/**
 * Add a new exercise to a workout group
 */
export async function addExercise(groupId: string, exercise: { title: string; sets: number; reps: number }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify ownership
  const group = await db
    .select({ id: workoutGroups.id })
    .from(workoutGroups)
    .where(and(eq(workoutGroups.id, groupId), eq(workoutGroups.userId, session.user.id)))
    .limit(1);

  if (group.length === 0) throw new Error("Group not found");

  const id = crypto.randomUUID();
  await db.insert(exercises).values({
    id,
    groupId,
    title: exercise.title,
    sets: exercise.sets,
    reps: exercise.reps,
  });

  revalidatePath("/dashboard/workout");
  return { success: true, id };
}

/**
 * Delete an exercise from a workout group
 */
export async function deleteExercise(exerciseId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify ownership through the group
  const exercise = await db
    .select({ id: exercises.id, groupId: exercises.groupId })
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (exercise.length === 0) throw new Error("Exercise not found");

  const group = await db
    .select({ id: workoutGroups.id })
    .from(workoutGroups)
    .where(and(eq(workoutGroups.id, exercise[0].groupId), eq(workoutGroups.userId, session.user.id)))
    .limit(1);

  if (group.length === 0) throw new Error("Unauthorized");

  await db.delete(exercises).where(eq(exercises.id, exerciseId));

  revalidatePath("/dashboard/workout");
  return { success: true };
}

/**
 * Update an existing exercise's details
 */
export async function updateExercise(exerciseId: string, data: { title: string; sets: number; reps: number }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  // Verify ownership through the group
  const exercise = await db
    .select({ id: exercises.id, groupId: exercises.groupId })
    .from(exercises)
    .where(eq(exercises.id, exerciseId))
    .limit(1);

  if (exercise.length === 0) throw new Error("Exercise not found");

  const group = await db
    .select({ id: workoutGroups.id })
    .from(workoutGroups)
    .where(and(eq(workoutGroups.id, exercise[0].groupId), eq(workoutGroups.userId, session.user.id)))
    .limit(1);

  if (group.length === 0) throw new Error("Unauthorized");

  await db
    .update(exercises)
    .set({ title: data.title, sets: data.sets, reps: data.reps })
    .where(eq(exercises.id, exerciseId));

  revalidatePath("/dashboard/workout");
  return { success: true };
}


