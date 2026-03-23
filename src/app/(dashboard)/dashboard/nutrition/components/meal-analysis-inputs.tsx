"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type MealSource = "home_cooked" | "restaurant" | "packaged";
export type MealRichness = "light" | "standard" | "heavy";
export type MealPortion = "bite_snack" | "single_meal" | "large_share";

export type MealAnalysisInputsValue = {
  mealName: string;
  ingredients: string;
  userNote: string;
  source: MealSource | null;
  richness: MealRichness | null;
  portion: MealPortion | null;
};

export interface MealAnalysisInputsProps {
  disabled?: boolean;
  storageKey?: string;
  onChange?: (value: MealAnalysisInputsValue) => void;
}

type Option<T extends string> = {
  id: T;
  label: string;
  emoji: string;
};

const SOURCE_OPTIONS: Option<MealSource>[] = [
  { id: "home_cooked", label: "مطبوخ منزلياً", emoji: "🏠" },
  { id: "restaurant", label: "مطعم", emoji: "🍽️" },
  { id: "packaged", label: "معلّب / جاهز", emoji: "📦" },
];

const RICHNESS_OPTIONS: Option<MealRichness>[] = [
  { id: "light", label: "خفيف", emoji: "🥗" },
  { id: "standard", label: "عادي", emoji: "🍛" },
  { id: "heavy", label: "ثقيل", emoji: "🍖" },
];

const PORTION_OPTIONS: Option<MealPortion>[] = [
  { id: "bite_snack", label: "سناك", emoji: "🥜" },
  { id: "single_meal", label: "وجبة واحدة", emoji: "🍽️" },
  { id: "large_share", label: "حصة كبيرة", emoji: "🍱" },
];

function readStoredValue(storageKey: string): MealAnalysisInputsValue | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MealAnalysisInputsValue>;
    const mealName = typeof parsed.mealName === "string" ? parsed.mealName : "";
    const ingredients = typeof parsed.ingredients === "string" ? parsed.ingredients : "";
    const userNote = typeof parsed.userNote === "string" ? parsed.userNote : "";
    const source = typeof parsed.source === "string" ? (parsed.source as MealSource) : null;
    const richness =
      typeof parsed.richness === "string" ? (parsed.richness as MealRichness) : null;
    const portion = typeof parsed.portion === "string" ? (parsed.portion as MealPortion) : null;
    return { mealName, ingredients, userNote, source, richness, portion };
  } catch {
    return null;
  }
}

function writeStoredValue(storageKey: string, value: MealAnalysisInputsValue) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function useRovingRadioGroup<T extends string>(
  options: ReadonlyArray<Option<T>>,
  selected: T | null,
  setSelected: (value: T) => void,
  disabled: boolean,
) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const activeIndex = options.findIndex((o) => o.id === selected);
    const currentIndex = activeIndex >= 0 ? activeIndex : 0;
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;

    let nextIndex = currentIndex;
    if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = options.length - 1;
    else nextIndex = (currentIndex + delta + options.length) % options.length;

    const next = options[nextIndex];
    setSelected(next.id);
    refs.current[nextIndex]?.focus();
  };

  return { refs, onKeyDown };
}

export function MealAnalysisInputs({
  disabled = false,
  storageKey = "nutrition.mealAnalysisInputs",
  onChange,
}: MealAnalysisInputsProps) {
  const initial = useMemo(() => readStoredValue(storageKey), [storageKey]);
  const [mealName, setMealName] = useState<string>(() => initial?.mealName ?? "");
  const [ingredients, setIngredients] = useState<string>(() => initial?.ingredients ?? "");
  const [userNote, setUserNote] = useState<string>(() => initial?.userNote ?? "");
  const [source, setSource] = useState<MealSource | null>(() => initial?.source ?? null);
  const [richness, setRichness] = useState<MealRichness | null>(() => initial?.richness ?? null);
  const [portion, setPortion] = useState<MealPortion | null>(() => initial?.portion ?? null);

  const value = useMemo<MealAnalysisInputsValue>(
    () => ({ mealName, ingredients, userNote, source, richness, portion }),
    [mealName, ingredients, userNote, source, richness, portion],
  );

  useEffect(() => {
    writeStoredValue(storageKey, value);
    onChange?.(value);
  }, [storageKey, value, onChange]);

  const sourceGroup = useRovingRadioGroup(SOURCE_OPTIONS, source, setSource, disabled);
  const richnessGroup = useRovingRadioGroup(
    RICHNESS_OPTIONS,
    richness,
    setRichness,
    disabled,
  );
  const portionGroup = useRovingRadioGroup(PORTION_OPTIONS, portion, setPortion, disabled);

  const inputClasses =
    "flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-nutrition/50 focus-visible:border-nutrition disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200";

  const optionClasses = (selected: boolean) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer outline-none focus-visible:ring-[1px] focus-visible:ring-nutrition/50 focus-visible:border-nutrition",
      selected
        ? "border-nutrition bg-nutrition/5 text-nutrition"
        : "border-border hover:border-nutrition/50 text-muted-foreground bg-transparent"
    );

  return (
    <div className="grid gap-4 mt-4">
      <div className="grid gap-2">
        <div className="font-extrabold text-sm text-foreground">
          اسم الوجبة (اختياري)
        </div>
        <input
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          disabled={disabled}
          className={cn(inputClasses, "h-11")}
          aria-label="اسم الوجبة"
          placeholder="مثال: دجاج مشوي مع أرز"
        />
      </div>

      <div className="grid gap-2">
        <div className="font-extrabold text-sm text-foreground">
          المكونات (اختياري)
        </div>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          disabled={disabled}
          className={cn(inputClasses, "min-h-[3.25rem] resize-y")}
          aria-label="المكونات"
          placeholder="مثال: دجاج، أرز، سلطة، زيت زيتون"
        />
      </div>

      <div className="grid gap-2">
        <div className="font-extrabold text-sm text-foreground">
          ملاحظة المستخدم (اختياري)
        </div>
        <textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          disabled={disabled}
          className={cn(inputClasses, "min-h-[3.25rem] resize-y")}
          aria-label="ملاحظة المستخدم"
          placeholder='مثال: "نصف دجاجة شواية مع رز قليل الزيت"'
        />
        <div className="text-xs text-muted-foreground leading-relaxed">
          تساعد الملاحظة على تحسين دقة التحليل.
        </div>
      </div>

      <div className="grid gap-3">
        <div className="font-extrabold text-sm text-foreground">
          المصدر (اختياري)
        </div>
        <div
          role="radiogroup"
          aria-label="المصدر"
          onKeyDown={sourceGroup.onKeyDown}
          className="grid grid-cols-3 gap-3"
        >
          {SOURCE_OPTIONS.map((item, index) => {
            const selected = source === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  sourceGroup.refs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={item.label}
                disabled={disabled}
                onClick={() => setSource(item.id)}
                className={optionClasses(selected)}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-bold text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="font-extrabold text-sm text-foreground">
          الدسامة (اختياري)
        </div>
        <div
          role="radiogroup"
          aria-label="الدسامة"
          onKeyDown={richnessGroup.onKeyDown}
          className="grid grid-cols-3 gap-3"
        >
          {RICHNESS_OPTIONS.map((item, index) => {
            const selected = richness === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  richnessGroup.refs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={item.label}
                disabled={disabled}
                onClick={() => setRichness(item.id)}
                className={optionClasses(selected)}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-bold text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="font-extrabold text-sm text-foreground">
          حجم الحصة (اختياري)
        </div>
        <div
          role="radiogroup"
          aria-label="حجم الحصة"
          onKeyDown={portionGroup.onKeyDown}
          className="grid grid-cols-3 gap-3"
        >
          {PORTION_OPTIONS.map((item, index) => {
            const selected = portion === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  portionGroup.refs.current[index] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={item.label}
                disabled={disabled}
                onClick={() => setPortion(item.id)}
                className={optionClasses(selected)}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-bold text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
