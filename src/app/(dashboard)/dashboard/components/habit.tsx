import { CheckCircle, Trophy } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";

type Props = {
  completed: number;
  total: number;
};

export const Habit = ({ completed, total }: Props) => {
  const progress = total === 0 ? 0 : completed / total;

  return (
    <WidgetCard
      title="العادات اليومية"
      icon={<CheckCircle className="h-5 w-5" />}
      colorClass="text-habit"
      borderClass="hover:border-habit/50"
      className="md:col-span-2"
    >
      <div className="flex items-center justify-between h-full mt-2">
        <div className="flex flex-col h-full justify-between">
          <div className="mt-4">
            <div className="text-5xl font-black flex items-baseline gap-2 tabular-nums">
              {completed}{" "}
              <span className="text-xl text-muted-foreground">/ {total}</span>
            </div>
            <p className="text-sm font-bold opacity-50 mt-1">عادات مكتملة</p>
          </div>
        </div>

        <div className="relative h-32 w-32 hidden sm:flex items-center justify-center me-8">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="var(--muted)"
              strokeWidth="12"
              fill="transparent"
              opacity={0.2}
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="var(--color-habit)"
              strokeWidth="12"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray="351"
              strokeDashoffset={351 - 351 * progress}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-habit" />
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};
