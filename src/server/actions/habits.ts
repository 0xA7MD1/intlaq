"use server";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { tasks, habitCompletion } from "@/server/db/schema";
import { and, eq, inArray, gte, lte, asc, sql } from "drizzle-orm";
import { headers } from "next/headers";

export type HabitStatus = "completed" | "failed" | "pending";

export type HabitWithStatus = {
  id: string;
  name: string;
  position: number;
  status: Record<string, HabitStatus>;
};

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** جلب قائمة العادات مع حالاتها للأسبوع المعطى */
export async function getHabitsWithStatusForWeek(
  startDate: string,
  endDate: string
): Promise<HabitWithStatus[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const userTasks = await db
    .select({ id: tasks.id, title: tasks.title, position: tasks.position })
    .from(tasks)
    .where(eq(tasks.userId, session.user.id))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  if (userTasks.length === 0) return [];

  const taskIds = userTasks.map((t) => t.id);
  const completions = await db
    .select({
      taskId: habitCompletion.taskId,
      date: habitCompletion.date,
      status: habitCompletion.status,
    })
    .from(habitCompletion)
    .where(
      and(
        inArray(habitCompletion.taskId, taskIds),
        gte(habitCompletion.date, startDate),
        lte(habitCompletion.date, endDate)
      )
    );

  const statusByTask: Record<string, Record<string, HabitStatus>> = {};
  for (const t of userTasks) {
    statusByTask[t.id] = {};
  }
  for (const c of completions) {
    const s = c.status as HabitStatus;
    if (s === "completed" || s === "failed" || s === "pending") {
      statusByTask[c.taskId] = statusByTask[c.taskId] ?? {};
      statusByTask[c.taskId][c.date] = s;
    }
  }

  return userTasks.map((t) => ({
    id: t.id,
    name: t.title,
    position: t.position,
    status: statusByTask[t.id] ?? {},
  }));
}

/** إضافة عادة جديدة */
export async function createHabit(name: string): Promise<{ id: string; position: number } | { error: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { error: "غير مصرح" };

  const title = name.trim();
  if (!title) return { error: "اسم العادة مطلوب" };

  // جلب أعلى قيمة للـ position
  const [maxPos] = await db
    .select({ max: sql<number>`max(${tasks.position})` })
    .from(tasks)
    .where(eq(tasks.userId, session.user.id));
  
  const nextPosition = (maxPos?.max ?? -1) + 1;

  const id = crypto.randomUUID();
  await db.insert(tasks).values({
    id,
    title,
    userId: session.user.id,
    isCompleted: false,
    position: nextPosition,
  });
  return { id, position: nextPosition };
}

/** إعادة ترتيب العادات */
export async function reorderHabits(orderedIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "غير مصرح" };

  try {
    // تحديث ترتيب كل عادة في قاعدة البيانات
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(tasks)
          .set({ position: i })
          .where(and(eq(tasks.id, orderedIds[i]), eq(tasks.userId, session.user.id)));
      }
    });
    return { ok: true };
  } catch (error) {
    console.error("Failed to reorder habits:", error);
    return { ok: false, error: "فشل تحديث الترتيب" };
  }
}

/** حذف عادة */
export async function deleteHabit(taskId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "غير مصرح" };

  const [row] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
    .limit(1);

  if (!row) return { ok: false, error: "العادة غير موجودة" };

  await db.delete(tasks).where(eq(tasks.id, taskId));
  return { ok: true };
}

/** تعيين حالة العادة في يوم معيّن */
export async function setHabitCompletion(
  taskId: string,
  date: string,
  status: HabitStatus
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "غير مصرح" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "تاريخ غير صالح" };
  if (!["completed", "failed", "pending"].includes(status))
    return { ok: false, error: "حالة غير صالحة" };

  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
    .limit(1);

  if (!task) return { ok: false, error: "العادة غير موجودة" };

  const existing = await db
    .select({ id: habitCompletion.id })
    .from(habitCompletion)
    .where(and(eq(habitCompletion.taskId, taskId), eq(habitCompletion.date, date)))
    .limit(1);

  const id = crypto.randomUUID();
  if (existing.length > 0) {
    await db
      .update(habitCompletion)
      .set({ status })
      .where(eq(habitCompletion.id, existing[0].id));
  } else {
    await db.insert(habitCompletion).values({
      id,
      taskId,
      date,
      status,
    });
  }
  return { ok: true };
}
