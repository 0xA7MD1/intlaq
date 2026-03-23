"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";

export function CalorieProgressWidget(props: {
  dailyCalorieTarget: number | null;
  consumed: number;
}) {
  const target = props.dailyCalorieTarget;

  const percent = useMemo(() => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.max(0, (props.consumed / target) * 100));
  }, [props.consumed, target]);

  return (
    <WidgetCard
      title="السعرات الحرارية"
      icon={<Flame className="h-5 w-5" />}
      colorClass="text-workout"
      borderClass=" hover:border-workout/50"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold opacity-60">المستهلك اليوم</span>
            <span className="text-3xl font-black tabular-nums">{props.consumed}</span>
          </div>
          <div className="flex flex-col gap-1 text-start">
            <span className="text-sm font-bold opacity-60">الهدف</span>
            <span className="text-xl font-black opacity-80 tabular-nums">
              {target ?? "—"}
            </span>
          </div>
        </div>

        <div
          className="mt-5 h-4 bg-secondary rounded-full overflow-hidden"
          role="progressbar"
          aria-label="تقدم السعرات اليومية"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
        >
          <div
            className="h-full rounded-full bg-workout transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

      </div>
    </WidgetCard>
  );
}
