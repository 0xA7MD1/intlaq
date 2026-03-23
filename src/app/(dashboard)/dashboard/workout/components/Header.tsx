"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Header() {
  return (
    <div className="flex flex-col gap-6 w-full px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="flex flex-col gap-1 items-start">
        <h1 className="text-3xl font-black text-[#0B1527] dark:text-white">مخطط التمارين</h1>
        <p className="text-[#848F9F] dark:text-gray-400 text-sm">أنشئ وأدر روتين تمارينك</p>
      </div>

      <div className="w-full flex items-center justify-between p-3 sm:p-[18px] lg:p-7 border border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-[#0B1527] shadow-sm dark:shadow-none">
        <button className="w-10 h-10 flex items-center justify-center text-workout hover:text-workout/80 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[#FD2B5B] font-bold text-base">١٩ رمضان - ٢٥ رمضان</span>
          <span className="text-[#A0AAB8] dark:text-gray-400 text-xs mt-0.5">هذا الأسبوع</span>
        </div>

        <button className="w-10 h-10 rounded-full bg-workout/10 flex items-center justify-center text-workout hover:bg-workout/20 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

