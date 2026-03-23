"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MiniMacroCard } from "./mini-macro-card";

type SavedMeal = {
  id: string;
  imageUrl: string;
  userInputs: Record<string, unknown>;
  aiAnalysis: Record<string, unknown>;
  createdAt: string;
};

function extractMacroNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function getPreview(meal: SavedMeal) {
  const ai =
    meal.aiAnalysis && typeof meal.aiAnalysis === "object"
      ? (meal.aiAnalysis as Record<string, unknown>)
      : null;
  const parsed =
    ai?.parsed && typeof ai.parsed === "object" ? (ai.parsed as Record<string, unknown>) : null;
  const calories = extractMacroNumber(parsed?.calories);
  const protein = extractMacroNumber(parsed?.protein);
  const carbs = extractMacroNumber(parsed?.carbs);
  const fat = extractMacroNumber(parsed?.fat);

  const inputs =
    meal.userInputs && typeof meal.userInputs === "object"
      ? (meal.userInputs as Record<string, unknown>)
      : null;
  const fromInputs = typeof inputs?.mealName === "string" ? inputs.mealName : null;
  const fromModel = typeof parsed?.name === "string" ? parsed.name : null;
  const name = (fromInputs && fromInputs.trim()) || fromModel || "وجبة";
  return { name, calories, protein, carbs, fat };
}

function readSelectedMealIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem("nutrition.selectedMeals.v1");
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((x) => typeof x === "string"));
  } catch {
    return new Set<string>();
  }
}

export function SavedMealsList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<SavedMeal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => readSelectedMealIds());

  useEffect(() => {
    setSelectedIds(readSelectedMealIds());
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);

        const res = await fetch(
          `/api/nutrition/meals?from=${start.toISOString()}&to=${end.toISOString()}&pageSize=50`,
          { cache: "no-store" },
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Request failed (${res.status})`);
        }
        const json = (await res.json()) as {
          items: SavedMeal[];
          totalCount: number;
        };
        if (cancelled) return;
        setItems(json.items);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [currentDate, refreshKey]);

  const handlePrevDay = () => {
    setCurrentDate((d) => {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      return prev;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="bg-card border rounded-4xl p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm font-bold opacity-60">
          {items.length} وجبة
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-sm font-black">
           {isToday ? "اليوم" : currentDate.toLocaleDateString("ar-EG", { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h3 className="text-lg font-black">وجباتك المحفوظة</h3>
      </div>

      {error ? (
        <div className="mt-4 text-sm text-red-500">{error}</div>
      ) : null}

      {items.length === 0 && !loading ? (
        <div className="mt-4 text-center py-12 border-2 border-dashed border-border rounded-3xl opacity-50">
          <div className="text-sm font-bold text-muted-foreground">
            لا توجد وجبات مسجلة في هذا اليوم
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((meal) => {
            const preview = getPreview(meal);
            const isSelected = selectedIds.has(meal.id);
            return (
              <div
                key={meal.id}
                className={
                  "border rounded-3xl overflow-hidden bg-background/40" +
                  (isSelected ? " border-nutrition/60" : "")
                }
              >
                <div className="relative aspect-video">
                  <Image
                    src={meal.imageUrl}
                    alt={preview.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black truncate">{preview.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(meal.createdAt).toLocaleString("ar", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                    {typeof preview.calories === "number" ? (
                      <div className="shrink-0 text-xs font-black text-red-500">
                        {preview.calories} كالوري
                      </div>
                    ) : null}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full py-2 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors font-bold flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" />
                        عرض التحليل
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-card border border-border p-6 rounded-3xl overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="text-center font-black text-2xl">
                          {preview.name}
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                          تفاصيل القيم الغذائية للوجبة
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex flex-col gap-6 mt-4">
                        {/* Meal Image */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-sm">
                          <Image
                            src={meal.imageUrl}
                            alt={preview.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Calories Display */}
                        <div className="bg-secondary/20 border border-border rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                          <div className="text-sm font-bold opacity-50 uppercase tracking-widest mb-1">
                            السعرات الحرارية
                          </div>
                          <div className="flex items-baseline gap-1 text-red-500">
                            <span className="text-5xl font-black">
                              {preview.calories || 0}
                            </span>
                            <span className="text-sm font-bold opacity-60">
                              كالوري
                            </span>
                          </div>
                        </div>

                        {/* Macros Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <MiniMacroCard
                            title="بروتين"
                            value={preview.protein || 0}
                            unit="g"
                            color="text-blue-400"
                          />
                          <MiniMacroCard
                            title="كارب"
                            value={preview.carbs || 0}
                            unit="g"
                            color="text-nutrition"
                          />
                          <MiniMacroCard
                            title="دهون"
                            value={preview.fat || 0}
                            unit="g"
                            color="text-yellow-400"
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
         <button
            onClick={handleNextDay}
            disabled={isToday || loading}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-2xl transition-colors font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" /> التالي
          </button>

          <button
            onClick={handlePrevDay}
            disabled={loading}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-2xl transition-colors font-bold flex items-center gap-2"
          >
            السابق <ChevronLeft className="h-4 w-4" />
          </button>
      </div>
    </div>
  );
}
