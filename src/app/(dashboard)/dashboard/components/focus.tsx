import { Timer } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";

type Props = {
  focusMinutes: number;
};

export const Focus = ({ focusMinutes }: Props) => {
  return (
    <WidgetCard
      title="التركيز"
      icon={<Timer className="h-5 w-5" />}
      colorClass="text-habit"
      borderClass="hover:border-habit/50"
      className="md:col-span-1"
    >
      <div className="flex flex-col justify-between h-full mt-2">
        <div className="mt-8">
          <span className="text-xs font-bold opacity-50 uppercase">وقت التركيز اليوم</span>
          <div className="text-4xl font-black mt-1 tabular-nums">{focusMinutes} د</div>
        </div>
      </div>
    </WidgetCard>
  );
};
