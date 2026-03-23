/**
 * خريطة ذكية لربط أسماء مجموعات التمارين بالأيقونات المناسبة
 * يبحث عن كلمات مفتاحية في اسم المجموعة ويعيد الإيموجي المناسب
 */

const WORKOUT_ICON_MAP: { keywords: string[]; icon: string }[] = [
  // أرجل
  { keywords: ["رجل", "أرجل", "ساق", "سيقان", "leg", "legs", "سكوات", "squat"], icon: "🦵" },
  // ذراع / يد
  { keywords: ["يد", "ذراع", "أذرع", "باي", "تراي", "arm", "arms", "bicep", "tricep"], icon: "💪" },
  // صدر
  { keywords: ["صدر", "chest", "بنش", "bench"], icon: "🫁" },
  // ظهر
  { keywords: ["ظهر", "back", "سحب", "pull"], icon: "🔙" },
  // كتف
  { keywords: ["كتف", "أكتاف", "shoulder", "shoulders"], icon: "🏋️" },
  // بطن / كور
  { keywords: ["بطن", "معدة", "كور", "core", "abs", "ab"], icon: "🎯" },
  // كارديو
  { keywords: ["كارديو", "cardio", "جري", "هرولة", "run", "running", "مشي", "walk"], icon: "🏃" },
  // علوي
  { keywords: ["علوي", "upper", "فوق"], icon: "⬆️" },
  // سفلي
  { keywords: ["سفلي", "lower", "تحت"], icon: "⬇️" },
  // كامل الجسم
  { keywords: ["كامل", "full", "جسم", "body", "فول"], icon: "🧍" },
  // تمدد / مرونة
  { keywords: ["تمدد", "مرونة", "stretch", "stretching", "يوقا", "yoga"], icon: "🧘" },
  // سباحة
  { keywords: ["سباحة", "swim", "swimming"], icon: "🏊" },
  // دفع
  { keywords: ["دفع", "push", "ضغط"], icon: "👐" },
  // ملاكمة
  { keywords: ["ملاكمة", "بوكس", "boxing", "box"], icon: "🥊" },
];

// الأيقونة الافتراضية
const DEFAULT_ICON = "🏋️‍♂️";

/**
 * يحصل على الأيقونة المناسبة بناءً على اسم المجموعة
 */
export function getWorkoutIcon(title: string): string {
  const normalizedTitle = title.toLowerCase().trim();

  for (const entry of WORKOUT_ICON_MAP) {
    for (const keyword of entry.keywords) {
      if (normalizedTitle.includes(keyword)) {
        return entry.icon;
      }
    }
  }

  return DEFAULT_ICON;
}
