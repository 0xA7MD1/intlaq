"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Flame,
  Apple,
  Utensils,
  Camera,
  ImageIcon,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { MacroCard } from "./macro-card";
import { MiniMacroCard } from "./mini-macro-card";
import {
  MealAnalysisInputs,
  type MealRichness,
  type MealPortion,
  type MealSource,
} from "./meal-analysis-inputs";
import { SavedMealsList } from "./saved-meals-list";
import { CalorieHeatmap } from "./calorie-heatmap";
import { getTodayNutritionSummary, type TodayNutritionSummary } from "@/server/actions/nutrition";

type AnalysisResult = {
  mealId?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} | null;

type MealApiResponse = {
  id: string;
  imageUrl: string;
  userInputs: Record<string, unknown>;
  aiAnalysis: unknown;
};

function getParsedAnalysis(aiAnalysis: unknown): Record<string, unknown> {
  if (!aiAnalysis || typeof aiAnalysis !== "object") return {};
  const v = aiAnalysis as Record<string, unknown>;
  const parsed = v.parsed;
  if (!parsed || typeof parsed !== "object") return {};
  return parsed as Record<string, unknown>;
}

function safeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
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

function writeSelectedMealIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem("nutrition.selectedMeals.v1", JSON.stringify([...ids]));
}

type NutritionClientProps = {
  initialTodaySummary: TodayNutritionSummary | null;
};

export function NutritionClient({ initialTodaySummary }: NutritionClientProps) {
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [mealFile, setMealFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [mealName, setMealName] = useState<string>("");
  const [ingredients, setIngredients] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");
  const [source, setSource] = useState<MealSource | null>(null);
  const [richness, setRichness] = useState<MealRichness | null>(null);
  const [portion, setPortion] = useState<MealPortion | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [todaySummary, setTodaySummary] = useState<TodayNutritionSummary | null>(initialTodaySummary);
  const [todaySummaryLoading, setTodaySummaryLoading] = useState(!initialTodaySummary);

  useEffect(() => {
    let cancelled = false;

    if (refreshKey === 0 && initialTodaySummary) {
      setTodaySummaryLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setTodaySummaryLoading(true);
    getTodayNutritionSummary()
      .then((data) => {
        if (!cancelled) {
          setTodaySummary(data);
        }
      })
      .finally(() => {
        if (!cancelled) setTodaySummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, initialTodaySummary]);

  // بعد العودة من شراء الكريدت: نتحقق من الرصيد فوراً ثم كل 2 ثانية
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;

    let attempts = 0;
    const maxAttempts = 8;
    const intervalMs = 2000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const check = async (): Promise<boolean> => {
      attempts++;
      try {
        const res = await fetch("/api/nutrition/credits-status");
        if (!res.ok) return false;
        const data = (await res.json()) as { hasCredits: boolean };
        if (data.hasCredits) {
          toast.success("تم تفعيل الرصيد! يمكنك تحليل وجباتك الآن 🎉");
          window.history.replaceState({}, "", window.location.pathname);
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };

    void check().then((done) => {
      if (done) return;
      intervalId = setInterval(async () => {
        const ok = await check();
        if (ok) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          return;
        }
        if (attempts >= maxAttempts) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          toast.info("تفعيل الرصيد قد يستغرق وقتاً. إن استمرت المشكلة تحقق من إعدادات الويبوك في Polar.");
        }
      }, intervalMs);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMealFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!mealFile) return;
    setAnalyzing(true);
    try {
      const userInputs = {
        mealName: mealName.trim(),
        ingredients: ingredients.trim(),
        userNote: userNote.trim(),
        source,
        richness,
        portion,
      };

      const form = new FormData();
      form.set("image", mealFile);
      form.set("user_inputs", JSON.stringify(userInputs));

      const res = await fetch("/api/nutrition/meals", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string; code?: string };
          if (data.code === "INSUFFICIENT_CREDITS") {
            message =
              "لا يوجد لديك رصيد كافٍ. قم بشراء رصيد أولاً. إذا أنهيت الشراء الآن، انتظر ثوانٍ ثم أعد المحاولة.";
          } else if (typeof data.error === "string") {
            message = data.error;
          }
        } catch {
          const txt = await res.text().catch(() => "");
          if (txt) message = txt;
        }
        throw new Error(message);
      }

      const json = (await res.json()) as MealApiResponse;
      const parsed = getParsedAnalysis(json.aiAnalysis);
      const fallbackName =
        (typeof userInputs.mealName === "string" && userInputs.mealName) ||
        (typeof userInputs.userNote === "string" && userInputs.userNote) ||
        "وجبة";

      setAnalysisResult({
        mealId: json.id,
        name: (typeof parsed.name === "string" && parsed.name) || fallbackName,
        calories: safeNumber(parsed.calories, 0),
        protein: safeNumber(parsed.protein, 0),
        carbs: safeNumber(parsed.carbs, 0),
        fat: safeNumber(parsed.fat, 0),
      });
      toast.success("تم تحليل الوجبة وحفظها! 🥗");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحليل الوجبة");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBuyCredits = () => {
    window.location.href = "/api/polar/checkout";
  };

  const handleSelectMeal = () => {
    const id = analysisResult?.mealId;
    if (!id) return;
    const ids = readSelectedMealIds();
    ids.add(id);
    writeSelectedMealIds(ids);
    toast.success("تم اعتماد الوجبة!");
    setMealImage(null);
    setMealFile(null);
    setAnalysisResult(null);
    setMealName("");
    setIngredients("");
    setUserNote("");
    setSource(null);
    setRichness(null);
    setPortion(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border rounded-4xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-1 w-full bg-linear-to-r from-transparent via-nutrition to-transparent opacity-50"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-nutrition/10 flex items-center justify-center text-nutrition">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-black">ماذا ستأكل اليوم؟</h3>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-video rounded-3xl bg-secondary/30 border-2 border-dashed border-nutrition/20 hover:border-nutrition/50 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden"
          >
            {mealImage ? (
              <>
                <Image
                  src={mealImage}
                  alt="Meal"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMealImage(null);
                    setMealFile(null);
                    setAnalysisResult(null);
                  }}
                  className="absolute top-3 right-3 bg-black/50 p-2 rounded-full hover:bg-black/80 text-white backdrop-blur-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="text-center space-y-3 p-4">
                <div className="h-16 w-16 mx-auto bg-card rounded-full flex items-center justify-center shadow-sm">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-muted-foreground">
                  اضغط لالتقاط صورة للوجبة
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <MealAnalysisInputs
            disabled={analyzing}
            onChange={(next) => {
              setMealName(next.mealName);
              setIngredients(next.ingredients);
              setUserNote(next.userNote);
              setSource(next.source);
              setRichness(next.richness);
              setPortion(next.portion);
            }}
          />

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyzeMeal}
              disabled={!mealFile || analyzing}
              className="flex-1 bg-nutrition text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {analyzing ? (
                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-5 w-5" /> تحليل الوجبة
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyCredits}
              className="sm:w-auto px-4 py-4 rounded-2xl font-bold text-sm border border-nutrition/60 text-nutrition bg-background hover:bg-nutrition/10 transition-colors flex items-center justify-center gap-2"
            >
              <Flame className="h-4 w-4" />
              شراء رصيد للتحليلات
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {analysisResult ? (
            <div className="h-full flex flex-col justify-center animate-in slide-in-from-bottom-5 duration-500 space-y-4">
              <div className="bg-card border border-nutrition/50 rounded-4xl p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold opacity-50 uppercase">
                    تم التعرف على
                  </span>
                  <h2 className="text-2xl font-black text-nutrition">
                    {analysisResult.name}
                  </h2>
                </div>
                <div className="h-14 w-14 rounded-2xl flex flex-col items-center justify-center leading-none text-white">
                  <span className="text-xl text-red-500 font-black">
                    {analysisResult.calories}
                  </span>
                  <span className="text-[9px] font-bold">كالوري</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MiniMacroCard
                  title="بروتين"
                  value={analysisResult.protein}
                  unit="g"
                  color="text-blue-400"
                />
                <MiniMacroCard
                  title="كارب"
                  value={analysisResult.carbs}
                  unit="g"
                  color="text-nutrition"
                />
                <MiniMacroCard
                  title="دهون"
                  value={analysisResult.fat}
                  unit="g"
                  color="text-yellow-400"
                />
              </div>

              <button
                onClick={handleSelectMeal}
                disabled={!analysisResult?.mealId}
                className="w-full py-4 bg-secondary hover:bg-secondary/80 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5" />
                اعتماد الوجبة وإضافتها
              </button>
            </div>
          ) : (
            <div className="h-full bg-card/50 border border-dashed border-border rounded-4xl p-8 flex flex-col items-center justify-center text-center opacity-50">
              <Flame className="h-16 w-16 mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-bold">بانتظار التحليل...</h3>
              <p className="text-sm mt-2 max-w-xs">
                ارفع صورة الوجبة لنقوم بحساب السعرات والماكروز تلقائياً.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-border/50">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
          <Utensils className="h-5 w-5 text-nutrition" />
          ملخص اليوم
          {todaySummary && todaySummary.mealsCount > 0 && (
            <span className="text-sm font-normal opacity-60">
              ({todaySummary.mealsCount} {todaySummary.mealsCount === 1 ? "وجبة" : "وجبات"})
            </span>
          )}
        </h2>

        {todaySummaryLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border rounded-4xl p-6 h-32 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : todaySummary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-1 bg-card border rounded-4xl p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold opacity-50 uppercase tracking-widest">
                  السعرات
                </span>
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-red-500">
                  {todaySummary.calories.toLocaleString("ar-SA")}
                </span>
                <span className="text-xs font-bold opacity-40">
                  / {todaySummary.dailyCalorieTarget?.toLocaleString("ar-SA") ?? "—"}
                </span>
              </div>
              <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{
                    width: todaySummary.dailyCalorieTarget && todaySummary.dailyCalorieTarget > 0
                      ? `${Math.min(100, (todaySummary.calories / todaySummary.dailyCalorieTarget) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>

            <MacroCard
              title="بروتين"
              value={`${todaySummary.protein}g`}
              total={`${todaySummary.targetProtein}g`}
              color="text-blue-500"
              bgColor="bg-blue-500"
              percent={
                todaySummary.targetProtein > 0
                  ? `${Math.min(100, Math.round((todaySummary.protein / todaySummary.targetProtein) * 100))}%`
                  : "0%"
              }
            />
            <MacroCard
              title="كاربوهيدرات"
              value={`${todaySummary.carbs}g`}
              total={`${todaySummary.targetCarbs}g`}
              color="text-nutrition"
              bgColor="bg-nutrition"
              percent={
                todaySummary.targetCarbs > 0
                  ? `${Math.min(100, Math.round((todaySummary.carbs / todaySummary.targetCarbs) * 100))}%`
                  : "0%"
              }
            />
            <MacroCard
              title="دهون"
              value={`${todaySummary.fat}g`}
              total={`${todaySummary.targetFat}g`}
              color="text-yellow-500"
              bgColor="bg-yellow-500"
              percent={
                todaySummary.targetFat > 0
                  ? `${Math.min(100, Math.round((todaySummary.fat / todaySummary.targetFat) * 100))}%`
                  : "0%"
              }
            />
          </div>
        ) : (
          <div className="bg-card border rounded-4xl p-6 text-center text-muted-foreground">
            لا توجد بيانات اليوم. أضف وجبات لترى الملخص.
          </div>
        )}
      </div>
      

      <SavedMealsList refreshKey={refreshKey} />

      <CalorieHeatmap />

      <div className="bg-card border rounded-4xl p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-nutrition/10 flex items-center justify-center shrink-0">
          <Apple className="h-5 w-5 text-nutrition" />
        </div>
        <div>
          <h3 className="font-bold mb-1">نصيحة اليوم</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نسبة البروتين لديك ممتازة اليوم! حاول تقليل الدهون في العشاء للوصول
            للهدف المثالي. 💪
          </p>
        </div>
      </div>
    </>
  );
}
