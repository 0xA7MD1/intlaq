import { Chart } from "./components/weight-chart";
import { DashboardCalorieCard } from "./components/dashboard-calorie-card";
import { Body } from "./components/workout";
import { Focus } from "./components/focus";
import { Habit } from "./components/habit";
import { DashboardHeader } from "./components/dashboard-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardSnapshot } from "@/server/actions/dashboard";
import { getWeightHistory, getUserProfile } from "@/server/actions/user";
import { getFocusStats } from "@/server/actions/focus";
import { getHabitsWithStatusForWeek } from "@/server/actions/habits";
import { Suspense } from "react";

// --- Skeletons ---
function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="h-12 w-64 bg-muted rounded-xl" />
      <div className="h-6 w-96 bg-muted rounded-lg" />
    </div>
  );
}

function CardSkeleton() {
  return <div className="h-48 w-full bg-card border rounded-[2.5rem] animate-pulse" />;
}

function ChartSkeleton() {
  return <div className="h-96 w-full bg-card border rounded-[2.5rem] animate-pulse" />;
}

type HeaderSectionProps = {
  greeting: string;
  profilePromise: ReturnType<typeof getUserProfile>;
};

async function HeaderSection({ greeting, profilePromise }: HeaderSectionProps) {
  const profile = await profilePromise;
  return <DashboardHeader greeting={greeting} name={profile?.name ?? ""} />;
}

type CalorieSectionProps = {
  snapshotPromise: ReturnType<typeof getDashboardSnapshot>;
};

async function CalorieSection({ snapshotPromise }: CalorieSectionProps) {
  const snapshot = await snapshotPromise;
  return (
    <DashboardCalorieCard 
      target={snapshot.profile.dailyCalorieTarget} 
      consumed={snapshot.today.totalCalories} 
    />
  );
}

type ChartSectionProps = {
  historyPromise: ReturnType<typeof getWeightHistory>;
  profilePromise: ReturnType<typeof getUserProfile>;
};

async function ChartSection({ historyPromise, profilePromise }: ChartSectionProps) {
  const [history, profile] = await Promise.all([historyPromise, profilePromise]);
  return <Chart history={history} currentWeight={profile?.weight ?? null} />;
}

type FocusSectionProps = {
  focusStatsPromise: ReturnType<typeof getFocusStats>;
};

async function FocusSection({ focusStatsPromise }: FocusSectionProps) {
  const stats = await focusStatsPromise;
  return <Focus focusMinutes={stats.totalFocusMinutes} />;
}

type HabitSectionProps = {
  today: string;
  habitsPromise: ReturnType<typeof getHabitsWithStatusForWeek>;
};

async function HabitSection({ today, habitsPromise }: HabitSectionProps) {
  const habits = await habitsPromise;
  const total = habits.length;
  const completed = habits.filter(h => h.status[today] === "completed").length;
  
  return <Habit completed={completed} total={total} />;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const hour = new Date().getHours();
  let greeting = "مساء النور";
  if (hour < 12) greeting = "صباح الخير";
  else if (hour < 18) greeting = "طاب يومك";

  const today = new Date().toISOString().slice(0, 10);

  const profilePromise = getUserProfile();
  const snapshotPromise = getDashboardSnapshot();
  const historyPromise = getWeightHistory();
  const focusStatsPromise = getFocusStats();
  const habitsPromise = getHabitsWithStatusForWeek(today, today);

  return (
    <div className="flex flex-col w-full h-full space-y-8 pb-10 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8" dir="rtl">
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderSection greeting={greeting} profilePromise={profilePromise} />
      </Suspense>

      {/* --- الصف الأول: بطاقات التغذية والنشاط --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Suspense fallback={<CardSkeleton />}>
          <CalorieSection snapshotPromise={snapshotPromise} />
        </Suspense>

        {/* 2. بطاقة النشاط (وردي - Accent) */}
        <Body />
      </div>

      {/* --- الصف الثاني: التركيز والعادات --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 3. التركيز (وردي - Accent) */}
        <Suspense fallback={<CardSkeleton />}>
          <FocusSection focusStatsPromise={focusStatsPromise} />
        </Suspense>

        {/* 4. متتبع العادات (ليموني - Primary) */}
        <Suspense fallback={<CardSkeleton />}>
          <HabitSection today={today} habitsPromise={habitsPromise} />
        </Suspense>
      </div>

      {/* --- الصف الثالث: رسم بياني للوزن --- */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection historyPromise={historyPromise} profilePromise={profilePromise} />
      </Suspense>
    </div>
  );
}
