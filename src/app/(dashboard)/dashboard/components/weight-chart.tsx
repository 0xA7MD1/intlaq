"use client";

import { TrendingUp } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  history: { day: string; weight: number }[];
  currentWeight: number | null;
};

export const Chart = ({ history, currentWeight }: Props) => {
  const data = history.length > 0 
    ? history.map(h => ({
        day: h.day.slice(8), // عرض اليوم فقط
        weight: h.weight
      }))
    : currentWeight 
      ? [{ day: "اليوم", weight: currentWeight }]
      : [];

  const latestWeight = data.length > 0 ? data[data.length - 1]?.weight : undefined;

  return (
    <WidgetCard
      title="تتبع الوزن"
      subtitle={data.length > 1 ? "آخر السجلات" : "الوزن الحالي"}
      icon={<TrendingUp className="h-5 w-5" />}
      colorClass="text-nutrition"
      borderClass="hover:border-nutrition/50"
      headerRight={
        latestWeight !== undefined ? (
          <div className="bg-nutrition text-black px-4 py-2 rounded-full text-sm font-black flex items-center gap-2 transition-colors group-hover:bg-nutrition/90">
            <TrendingUp className="h-4 w-4" />
            {latestWeight} كجم
          </div>
        ) : null
      }
    >
      <div className="h-75 w-full" dir="ltr">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-nutrition)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-nutrition)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--foreground)",
                  fontSize: 12,
                  opacity: 0.5,
                  fontWeight: "bold",
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--foreground)",
                  fontSize: 12,
                  opacity: 0.5,
                  fontWeight: "bold",
                }}
                domain={["dataMin - 1", "dataMax + 1"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  color: "var(--foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--color-nutrition)"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorWeight)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground font-bold">
            لا توجد بيانات وزن بعد
          </div>
        )}
      </div>
    </WidgetCard>
  );
};
