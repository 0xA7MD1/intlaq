import { Dumbbell } from "lucide-react";

interface TodaySummaryCardProps {
  todayWorkouts: string[];
  totalGroups: number;
}

export function TodaySummaryCard({ todayWorkouts, totalGroups }: TodaySummaryCardProps) {
  return (
    <div className="bg-white dark:bg-workout/10 border border-gray-200 dark:border-workout/20 rounded-4xl p-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-workout/20 flex items-center justify-center shrink-0">
          <Dumbbell className="w-7 h-7 text-workout" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
            تمرين اليوم
          </p>
          {todayWorkouts.length > 0 ? (
            <h2 className="text-2xl font-black truncate">{todayWorkouts.join(" + ")}</h2>
          ) : (
            <h2 className="text-2xl font-black text-muted-foreground">راحة 🛌</h2>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-3xl font-black text-workout">{totalGroups}</div>
        <div className="text-xs text-muted-foreground font-medium">مجموعة تمارين</div>
      </div>
    </div>
  );
}
