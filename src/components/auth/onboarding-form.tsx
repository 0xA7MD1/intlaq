"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Ruler, Weight, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import type { UserData } from "@/types"; // تأكد من المسار
import { completeOnboarding } from "@/server/actions/user";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { safeReadDashboardCache, safeWriteDashboardCache } from "@/lib/dashboard-cache";

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

type OnboardingFormProps = {
  onOpenChange: (open: boolean) => void;
  forceOnboarding?: (arg0: boolean) => void;
};

export default function OnboardingForm({ onOpenChange, forceOnboarding }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [inputs, setInputs] = useState({
    gender: "male" as UserData["gender"],
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "maintain" as UserData["goal"],
  });

  const handleSubmit = async () => {
    // 1. تحويل القيم لأرقام
    const ageVal = Number(inputs.age);
    const heightVal = Number(inputs.height);
    const weightVal = Number(inputs.weight);

    // 2. التحقق من وجود القيم ومنطقيتها
    if (!inputs.age || !inputs.height || !inputs.weight) {
      toast.error("الرجاء تعبئة جميع الحقول");
      return;
    }

    if (!inputs.activityLevel) {
      toast.error("اختر مستوى نشاطك اليومي");
      return;
    }

    if (ageVal < 10 || ageVal > 100) return toast.error("العمر غير منطقي");
    if (heightVal < 50 || heightVal > 250)
      return toast.error("الطول غير منطقي");
    if (weightVal < 30 || weightVal > 300)
      return toast.error("الوزن غير منطقي");

    setIsLoading(true);

    try {
      // إعداد البيانات بالنوع المطلوب بدقة
      const payload: Pick<
        UserData,
        "gender" | "age" | "height" | "weight" | "activityLevel" | "goal"
      > = {
        gender: inputs.gender as UserData["gender"],
        age: ageVal,
        height: heightVal,
        weight: weightVal,
        goal: inputs.goal as UserData["goal"],
        activityLevel: inputs.activityLevel as UserData["activityLevel"],
      };

      const result = await completeOnboarding(payload);

      if (session?.user?.id) {
        const userId = session.user.id;
        const today = getTodayDateString();
        const existing = safeReadDashboardCache(userId);
        safeWriteDashboardCache(userId, {
          profile: {
            name: session.user.name ?? null,
            dailyCalorieTarget: result.dailyCalorieTarget,
            userUpdatedAt: new Date().toISOString(),
          },
          today: {
            date: today,
            totalCalories: existing?.today.date === today ? existing.today.totalCalories : 0,
          },
        });
      }

      toast.success("تم تشغيل محرك انطلاق! 🚀");
      if (forceOnboarding) forceOnboarding(true);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("فشل حفظ البيانات، حاول مرة أخرى");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 px-1 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* اختيار الجنس بتصميم أنظف */}
      <div className="space-y-2">
        <Label className="text-sm font-bold text-muted-foreground mr-1">
          الجنس
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "male", label: "ذكر", emoji: "👨" },
            { id: "female", label: "أنثى", emoji: "👩" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setInputs({ ...inputs, gender: item.id as UserData["gender"] })
              }
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${
                inputs.gender === item.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/30 text-muted-foreground"
              }`}
            >
              {inputs.gender === item.id && (
                <Check className="absolute top-2 left-2 h-4 w-4 text-primary animate-in zoom-in" />
              )}
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {item.emoji}
              </span>
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* العمر */}
        <div className="space-y-2">
          <Label className="font-bold text-sm text-muted-foreground mr-1">
            العمر
          </Label>
          <div className="relative">
            <Activity className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input
              type="number"
              className="pr-10 h-12 rounded-xl bg-background/50 font-bold text-base focus-visible:ring-primary/20"
              placeholder="24"
              value={inputs.age}
              onChange={(e) => setInputs({ ...inputs, age: e.target.value })}
            />
          </div>
        </div>

        {/* الطول */}
        <div className="space-y-2">
          <Label className="font-bold text-sm text-muted-foreground mr-1">
            الطول (سم)
          </Label>
          <div className="relative">
            <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input
              type="number"
              className="pr-10 h-12 rounded-xl bg-background/50 font-bold text-base focus-visible:ring-primary/20"
              placeholder="175"
              value={inputs.height}
              onChange={(e) => setInputs({ ...inputs, height: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* الوزن */}
      <div className="space-y-2">
        <Label className="font-bold text-sm text-muted-foreground mr-1">
          الوزن الحالي (كجم)
        </Label>
        <div className="relative">
          <Weight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
          <Input
            type="number"
            className="pr-10 h-12 rounded-xl bg-background/50 font-bold text-base focus-visible:ring-primary/20"
            placeholder="75.5"
            value={inputs.weight}
            onChange={(e) => setInputs({ ...inputs, weight: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="font-bold text-sm text-muted-foreground mr-1">
          هدفك
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "maintain", label: "ثبات", emoji: "⚖️" },
            { id: "cut", label: "تنشيف", emoji: "📉" },
            { id: "bulk", label: "زيادة", emoji: "📈" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setInputs({ ...inputs, goal: item.id as UserData["goal"] })
              }
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 group ${
                inputs.goal === item.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/30 text-muted-foreground"
              }`}
            >
              {inputs.goal === item.id && (
                <Check className="absolute top-2 left-2 h-4 w-4 text-primary animate-in zoom-in" />
              )}
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {item.emoji}
              </span>
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="font-bold text-sm text-muted-foreground mr-1">
          مستوى النشاط اليومي
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              id: "sedentary",
              label: "خامل",
              sub: "مكتب / لا رياضة",
              emoji: "🏢",
            },
            {
              id: "light",
              label: "خفيف",
              sub: "مشي / رياضة خفيفة",
              emoji: "🚶",
            },
            {
              id: "moderate",
              label: "متوسط",
              sub: "3-5 أيام تمرين",
              emoji: "🏋️",
            },
            {
              id: "active",
              label: "نشط جداً",
              sub: "تمرين يومي شديد",
              emoji: "🔥",
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setInputs({ ...inputs, activityLevel: item.id })}
              className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 group ${
                inputs.activityLevel === item.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/30 text-muted-foreground"
              }`}
            >
              {inputs.activityLevel === item.id && (
                <Check className="absolute top-2 left-2 h-4 w-4 text-primary animate-in zoom-in" />
              )}
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {item.emoji}
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-sm">{item.label}</span>
                <span className="text-[10px] opacity-70 leading-tight">
                  {item.sub}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full h-12 rounded-xl font-bold text-lg mt-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "إكمال التسجيل 🚀"}
      </Button>
    </div>
  );
}
