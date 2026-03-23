import { NutritionClient } from "./components/nutrition-client";
import { getTodayNutritionSummary } from "@/server/actions/nutrition";

export default async function NutritionPage() {
  const todaySummary = await getTodayNutritionSummary();

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 pb-12 pt-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* --- 1. الترويسة --- */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">نظام التغذية</h1>
        <p className="text-muted-foreground mt-1">
          حلل وجباتك بالذكاء الاصطناعي وتابع سعراتك. 🍎
        </p>
      </div>

      {/* --- 2. المكون التفاعلي (عميل) --- */}
      <NutritionClient initialTodaySummary={todaySummary} />
    </div>
  );
}
