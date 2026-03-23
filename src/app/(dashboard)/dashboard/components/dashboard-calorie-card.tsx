"use client";

import { CalorieProgressWidget } from "./calorie-progress-widget";

type Props = {
  target: number | null;
  consumed: number;
};

export function DashboardCalorieCard({ target, consumed }: Props) {
  return <CalorieProgressWidget dailyCalorieTarget={target} consumed={consumed} />;
}
