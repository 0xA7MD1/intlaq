import { Header } from "./components/Header";
import { WeeklyProgress } from "./components/WeeklyProgress";
import { WorkoutGroups } from "./components/WorkoutGroups";
import { TodaySummaryCard } from "./components/TodaySummaryCard";
import { WeeklyScheduleCard } from "./components/WeeklyScheduleCard";
import { getWorkoutGroups, getWorkoutLogsByDateRange } from "@/server/actions/workouts";

export default async function WorkoutPage() {
  const groups = await getWorkoutGroups();

  // Get date range for the current week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(today);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  const startDate = startOfWeek.toISOString().split("T")[0];
  const endDate = endOfWeek.toISOString().split("T")[0];

  const logs = await getWorkoutLogsByDateRange(startDate, endDate);

  // Compute TodaySummaryCard props
  const todayStr = today.toISOString().split("T")[0];
  const todayWorkouts = logs.filter((log) => log.date === todayStr).map((log) => log.groupTitle);
  const totalGroups = groups.length;

  // Format data for WeeklyScheduleCard
  // The component expects a client-side navigation or a specific structure.
  // Wait, WeeklyScheduleCard has "navigateWeek", "getWorkoutForDay" which are client-side interactions.
  // I should provide a wrapper or change it to be a client component itself that manages weeks.
  // Let me just add the TodaySummaryCard for now, and see if the user wants WeeklyScheduleCard 
  // replacing WeeklyProgress or alongside it. Let's add it instead of WeeklyProgress if it's better, or keep both.
  
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 pb-12 pt-6 " dir="rtl">
      <Header />
      
      <div className="px-4 sm:px-6 lg:px-8 w-full mt-4">
        <TodaySummaryCard todayWorkouts={todayWorkouts} totalGroups={totalGroups} />
      </div>

      <WeeklyProgress logs={logs} />
      <WorkoutGroups groups={groups} />
    </div>
  );
}

