

import { FocusTimer } from "./components/focus-timer";
import { HabitsTracker } from "./components/habits-tracker";

export default function HabitsPage() {
  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 pb-12 pt-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* Header */}
      <h1 className="text-3xl font-black">العادات والتركيز</h1>
      <p className="text-muted-foreground">تتبع وقتك وعاداتك لتحقيق أهدافك</p>

      <FocusTimer />
      
      <HabitsTracker />
    </div>
  );
}
