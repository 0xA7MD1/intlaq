"use client";
import { Zap } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";

function TomorrowWorkout() {
  return (
    <div className="w-full sm:w-56 rounded-2xl border border-border/70 bg-secondary/30 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-black opacity-60">تمرين بكرة</span>
        <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">راحة</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full bg-workout/10 text-workout px-3 py-1 text-xs font-black">
          تمرين علوي
        </span>
        <span className="inline-flex items-center rounded-full bg-secondary text-muted-foreground px-3 py-1 text-xs font-bold">
          راحة
        </span>
      </div>
    </div>
  );
}

export const Body = () => {
  const todayWorkout = "تمرين صدر";

  return (
    <WidgetCard
      title="النشاط البدني"
      icon={<Zap className="h-5 w-5" />}
      colorClass="text-workout"
      borderClass="hover:border-workout/50"
    >
      <div dir="rtl" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-full">
        <div className="flex flex-col justify-center text-right gap-1.5 min-w-0">
          <span className="text-[11px] sm:text-xs font-bold tracking-widest opacity-60">
            تمرين اليوم
          </span>
          <span className="text-2xl sm:text-3xl font-black truncate" title={todayWorkout}>
            {todayWorkout}
          </span>
        </div>

        <TomorrowWorkout />
      </div>
    </WidgetCard>
  );
};
