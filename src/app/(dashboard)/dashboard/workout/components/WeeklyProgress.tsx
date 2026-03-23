"use client";

import { cn } from "@/lib/utils";

interface WorkoutLog {
  id: string;
  date: string;
  status: string;
  groupId: string;
  groupTitle: string;
}

interface DayData {
  dayName: string;
  date: number;
  status: "empty" | "orange" | "green" | "red" | "active";
  percentage?: number;
}

export function WeeklyProgress({ logs = [] }: { logs?: WorkoutLog[] }) {
  const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  
  // Build current week
  const today = new Date();
  const currentDayIndex = today.getDay();
  const weekDaysData: DayData[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - currentDayIndex + i); // from Sunday to Saturday
    const dateStr = d.toISOString().split("T")[0];
    const logForDay = logs.find((l) => l.date === dateStr);
    
    let status: DayData["status"] = "empty";
    let percentage = 0;

    if (logForDay) {
      status = "green";
      percentage = 100;
    } else if (d.toDateString() === today.toDateString()) {
      status = "active";
    }

    weekDaysData.push({
      dayName: arabicDays[i],
      date: d.getDate(),
      status,
      percentage,
    });
  }

  return (
    <div className="flex flex-col gap-6 w-full mt-2 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="border border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-[#0B1527] shadow-sm dark:shadow-none p-3 sm:p-[18px] lg:p-7 w-full max-w-none overflow-x-auto">
        <div className="flex items-center justify-between mb-6 px-4 min-w-[500px]">
          <div className="w-full flex justify-between gap-4 sm:gap-6">
            {weekDaysData.map((day, index) => {
              const isActive = day.status === "active";

              return (
                <div key={index} className="flex flex-col items-center gap-3 flex-1 min-w-[50px]">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs font-medium",
                        isActive ? "text-[#FD2B5B]" : "text-[#A0AAB8] dark:text-gray-400"
                      )}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={cn(
                        "text-sm sm:text-lg font-bold",
                        isActive ? "text-[#FD2B5B]" : "text-[#0B1527] dark:text-white"
                      )}
                    >
                      {day.date}
                    </span>
                  </div>

                  {/* Progress Box */}
                  <div className="w-full relative pt-[100%]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {day.status === "empty" && (
                        <div className="w-full h-full rounded-xl sm:rounded-2xl bg-[#F4F6F8] dark:bg-gray-800"></div>
                      )}

                      {day.status === "orange" && (
                        <div className="w-full h-full rounded-xl sm:rounded-2xl bg-[#FFEDDF] dark:bg-[#F97316]/10 flex items-center justify-center">
                          <span className="text-[#F97316] font-bold text-xs sm:text-sm">{day.percentage}%</span>
                        </div>
                      )}

                      {day.status === "green" && (
                        <div className="w-full h-full rounded-xl sm:rounded-2xl bg-[#E5F7EB] dark:bg-[#22C55E]/10 flex items-center justify-center">
                          <span className="text-[#22C55E] font-bold text-xs sm:text-sm">{day.percentage}%</span>
                        </div>
                      )}

                      {day.status === "red" && (
                        <div className="w-full h-full rounded-xl sm:rounded-2xl bg-[#FCEAE8] dark:bg-[#EF4444]/10 flex items-center justify-center">
                          <span className="text-[#EF4444] font-bold text-xs sm:text-sm">{day.percentage}%</span>
                        </div>
                      )}

                      {day.status === "active" && (
                        <button className="w-full h-full rounded-xl sm:rounded-2xl bg-[#FD2B5B] flex flex-col items-center justify-center gap-1 hover:bg-[#E51E4E] transition-colors">
                          <span className="text-white font-bold text-[10px] sm:text-xs leading-tight text-center whitespace-pre-wrap">
                            {"ابدأ\nالتمرين"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-end items-center gap-6 mt-2 pt-4 border-t border-gray-50/50 dark:border-gray-800 text-[10px] sm:text-xs text-[#848F9F] dark:text-gray-400 font-medium">
          <div className="flex items-center gap-2">
            <span>70 - 100%</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
          </div>
          <div className="flex items-center gap-2">
            <span>30 - 69%</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div>
          </div>
          <div className="flex items-center gap-2">
            <span>0 - 29%</span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
