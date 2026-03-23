"use server";

import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { timeSessions } from "@/server/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidateTag, unstable_cache } from "next/cache";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type FocusStats = {
  streak: number;
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  completedRounds: number;
};

/** حفظ جلسة تركيز أو راحة */
export async function saveFocusSession(payload: {
  type: "focus" | "break";
  startTime: Date;
  endTime: Date;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  await db.insert(timeSessions).values({
    id: crypto.randomUUID(),
    userId,
    type: payload.type,
    startTime: payload.startTime,
    endTime: payload.endTime,
  });

  revalidateTag(`focus-stats-${userId}`, "default");
  return { success: true };
}

/** مسح كافة بيانات وجلسات التركيز من السيرفر وقاعدة البيانات */
export async function hardResetFocusData() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 1. حذف من قاعدة البيانات للمستخدم الحالي فقط
  await db.delete(timeSessions).where(eq(timeSessions.userId, userId));

  // 2. إجبار السيرفر على إعادة التحميل
  revalidateTag(`focus-stats-${userId}`, "default");
  
  return { success: true };
}

/** جلب إحصائيات التركيز اليومية والسلسلة */
export async function getFocusStats(): Promise<FocusStats> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { streak: 0, totalFocusMinutes: 0, totalBreakMinutes: 0, completedRounds: 0 };
  }

  const userId = session.user.id;

  return await unstable_cache(
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // 1. جلب جلسات اليوم
      const todaySessions = await db
        .select()
        .from(timeSessions)
        .where(
          and(
            eq(timeSessions.userId, userId),
            gte(timeSessions.startTime, today),
            lte(timeSessions.startTime, tomorrow)
          )
        );

      let focusSeconds = 0;
      let breakSeconds = 0;
      let rounds = 0;

      for (const s of todaySessions) {
        if (!s.endTime) continue;
        const diff = (s.endTime.getTime() - s.startTime.getTime()) / 1000;
        if (s.type === "focus") {
          focusSeconds += diff;
          rounds++; // نعتبر كل جلسة تركيز مكتملة كجولة
        } else {
          breakSeconds += diff;
        }
      }

      // 2. حساب السلسلة (Streak)
      const streakResult = await db.execute(sql`
        WITH dates AS (
          SELECT DISTINCT date_trunc('day', start_time) as focus_date
          FROM time_sessions
          WHERE user_id = ${userId} AND type = 'focus'
        ),
        streak_calc AS (
          SELECT focus_date,
                 focus_date - (ROW_NUMBER() OVER (ORDER BY focus_date DESC) * INTERVAL '1 day') as grp
          FROM dates
        )
        SELECT COUNT(*) as streak
        FROM streak_calc
        WHERE grp = (
          SELECT grp FROM streak_calc ORDER BY focus_date DESC LIMIT 1
        )
        AND EXISTS (
          SELECT 1 FROM dates 
          WHERE focus_date >= date_trunc('day', now()) - INTERVAL '1 day'
        )
      `);

      const streak = Number(streakResult[0]?.streak ?? 0);

      return {
        streak,
        totalFocusMinutes: Math.floor(focusSeconds / 60),
        totalBreakMinutes: Math.floor(breakSeconds / 60),
        completedRounds: rounds,
      };
    },
    [`focus-stats-${userId}`],
    {
      tags: [`focus-stats-${userId}`],
      revalidate: 3600,
    }
  )();
}
