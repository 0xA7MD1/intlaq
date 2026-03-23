import { Calendar, ChevronRight, ChevronLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeekDay {
  dayName: string;
  date: number;
  fullDate: Date;
}

interface WeeklyScheduleCardProps {
  weekDays: WeekDay[];
  formatDisplayDate: (date: Date) => string;
  navigateWeek: (direction: "prev" | "next") => void;
  getWorkoutForDay: (dayName: string) => string[];
  isToday: (fullDate: Date) => boolean;
}

export function WeeklyScheduleCard({
  weekDays,
  formatDisplayDate,
  navigateWeek,
  getWorkoutForDay,
  isToday,
}: WeeklyScheduleCardProps) {
  return (
    <div className="bg-card border rounded-4xl p-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Calendar className="w-5 h-5 text-workout" />
          الجدول الأسبوعي
        </h2>
        <div className="flex items-center gap-1 p-1 rounded-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateWeek("next")}
            className="h-8 w-8 rounded-lg bg-transparent hover:bg-secondary/80 dark:hover:bg-secondary/50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold px-2 min-w-[130px] text-center hidden sm:block">
            {formatDisplayDate(weekDays[0].fullDate)} - {formatDisplayDate(weekDays[6].fullDate)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateWeek("prev")}
            className="h-8 w-8 rounded-lg bg-transparent hover:bg-secondary/80 dark:hover:bg-secondary/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="grid grid-cols-7 gap-2 min-w-[420px]">
          {weekDays.map((day, index) => {
            const workouts = getWorkoutForDay(day.dayName);
            const hasWorkout = workouts.length > 0;
            const today = isToday(day.fullDate);

            return (
              <div
                key={index}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-2 sm:p-3 rounded-2xl border transition-all duration-300 cursor-pointer",
                  today
                    ? "bg-workout/10 border-workout shadow-[0_0_20px_-5px_var(--color-workout)]"
                    : "bg-secondary/30 border-border/50 hover:border-workout/30"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                    today ? "bg-workout text-white" : "text-muted-foreground"
                  )}
                >
                  {day.dayName}
                </span>
                <span
                  className={cn(
                    "text-xl font-black",
                    today ? "text-workout" : "text-foreground"
                  )}
                >
                  {day.date}
                </span>
                <div className="flex flex-col items-center justify-center gap-1 w-full min-h-[40px]">
                  {hasWorkout ? (
                    <>
                      <span className="text-[9px] font-bold text-center leading-tight line-clamp-2 px-1 w-full text-workout">
                        {workouts[0]}
                      </span>
                      {workouts.length > 1 && (
                        <span className="text-[9px] text-muted-foreground">+{workouts.length - 1}</span>
                      )}
                      <div className="w-5 h-5 rounded-full bg-workout/20 flex items-center justify-center text-workout">
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </div>
                    </>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/50 font-medium">راحة</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
