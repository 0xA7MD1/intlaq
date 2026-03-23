"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type DayStatus = "under_goal" | "on_goal" | "slightly_over" | "significantly_over" | "empty";

interface DayData {
  date: Date;
  calories: number;
  goal: number;
  status: DayStatus;
}

export function CalorieHeatmap() {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const [data, setData] = useState<DayData[]>([]);

  // Generate mock data for the last 90 days
  useEffect(() => {
    const days: DayData[] = [];
    const today = new Date();
    
    // Create 90 days of data
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const rand = Math.random();
      let status: DayStatus = "empty";
      let calories = 0;
      const goal = 2500;

      if (rand > 0.1) {
         // Generate calories between 1800 and 3200
         const deviation = Math.floor(Math.random() * 1400) - 700; // -700 to +700
         calories = goal + deviation;
         
         // Assuming goal is "Cutting" (Tanasheef)
         // Under Goal (Good): < Goal - 100
         // On Goal (Good): Goal +/- 100
         // Slightly Over (Warning): Goal + 100 to Goal + 500
         // Significantly Over (Danger): > Goal + 500

         if (calories < goal - 100) {
             status = "under_goal";
         } else if (calories <= goal + 100) {
             status = "on_goal";
         } else if (calories <= goal + 500) {
             status = "slightly_over";
         } else {
             status = "significantly_over";
         }
      }

      days.push({
        date,
        calories,
        goal,
        status,
      });
    }
    // Use setTimeout to avoid synchronous setState in effect lint error
    setTimeout(() => setData(days), 0);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getStatusStyles = (status: DayStatus) => {
    switch (status) {
      case "under_goal":
        return "border-emerald-600 bg-emerald-600/20 text-emerald-700 hover:bg-emerald-600/30";
      case "on_goal":
        return "border-green-500 bg-green-500/20 text-green-700 hover:bg-green-500/30";
      case "slightly_over":
        return "border-yellow-400 bg-yellow-400/20 text-yellow-700 hover:bg-yellow-400/30";
      case "significantly_over":
        return "border-red-500 bg-red-500/20 text-red-700 hover:bg-red-500/30";
      default:
        return "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary";
    }
  };

  const weekDays = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  const startOffset = data[0]?.date.getDay() || 0;

  return (
    <>
      <div className="bg-card border rounded-4xl p-6 w-full relative overflow-hidden">
        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm p-4 text-center">
          <div className="bg-background/80 p-6 rounded-3xl shadow-lg border border-border/50 max-w-sm">
            <h3 className="text-2xl font-black mb-2">قريباً 🚀</h3>
            <p className="text-sm text-muted-foreground font-medium">
              نعمل على تطوير ميزة خريطة السعرات لتتبع التزامك بشكل أفضل.
            </p>
          </div>
        </div>

        <div className="opacity-40 pointer-events-none filter blur-[2px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Scale className="h-5 w-5" />
                خريطة السعرات (آخر 90 يوم)
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                تابع التزامك بالسعرات الحرارية خلال آخر 3 أشهر
              </p>
            </div>
          </div>

          <div className="mt-6">
            {/* Days Header - Repeated twice for 14 columns */}
            <div className="grid grid-cols-14 gap-1.5 mb-2 text-center">
              {[...weekDays, ...weekDays].map((day, i) => (
                <div key={i} className="text-[10px] font-bold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-14 gap-1.5">
              {/* Add spacers for alignment */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`spacer-${i}`} />
              ))}

              {data.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square rounded-md border-[1.5px] flex items-center justify-center",
                    getStatusStyles(day.status)
                  )}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-end gap-4 mt-6 text-[10px] sm:text-xs font-bold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-secondary border border-border" />
                <span>لا بيانات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-600/20 border border-emerald-600" />
                <span>تحت الهدف</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500" />
                <span>في الهدف</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-yellow-400/20 border border-yellow-400" />
                <span>فوق قليلاً</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
                <span>فوق كثيراً</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl">
              تفاصيل يوم {selectedDay && formatDate(selectedDay.date)}
            </DialogTitle>
            <DialogDescription className="text-center">
              تفاصيل السعرات والوجبات لهذا اليوم
            </DialogDescription>
          </DialogHeader>
          
          {selectedDay && (
             <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-3xl border-2 w-full max-w-xs",
                   getStatusStyles(selectedDay.status)
                )}>
                  <span className="text-3xl font-black mb-1">{selectedDay.calories}</span>
                  <span className="text-sm font-bold opacity-80">/ {selectedDay.goal} سعرة</span>
                  
                  <div className="mt-4 pt-4 border-t border-current/20 w-full flex justify-between text-sm font-bold">
                    <span>الفرق:</span>
                    <span dir="ltr">
                      {selectedDay.calories - selectedDay.goal > 0 ? "+" : ""}
                      {selectedDay.calories - selectedDay.goal}
                    </span>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm font-medium">
                  قريباً: سيتم عرض تفاصيل الوجبات هنا...
                </p>
             </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
