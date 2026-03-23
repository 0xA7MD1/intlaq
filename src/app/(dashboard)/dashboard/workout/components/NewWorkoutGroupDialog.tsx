"use client";

import { useState, useTransition } from "react";
import { Plus, X, ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createWorkoutGroup } from "@/server/actions/workouts";
import { toast } from "sonner";

interface ExerciseInput {
  id: string;
  title: string;
  sets: number;
  reps: number;
  isExpanded: boolean;
}

export function NewWorkoutGroupDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { id: "1", title: "", sets: 3, reps: 10, isExpanded: true }
  ]);

  const WEEK_DAYS = [
    { key: "أحد", label: "أحد" },
    { key: "اثنين", label: "اثنين" },
    { key: "ثلاثاء", label: "ثلاثاء" },
    { key: "أربعاء", label: "أربعاء" },
    { key: "خميس", label: "خميس" },
    { key: "جمعة", label: "جمعة" },
    { key: "سبت", label: "سبت" },
  ];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addExercise = () => {
    setExercises([
      ...exercises.map(e => ({ ...e, isExpanded: false })), // Collapse others
      { id: crypto.randomUUID(), title: "", sets: 3, reps: 10, isExpanded: true }
    ]);
  };

  const updateExercise = (id: string, field: keyof ExerciseInput, value: any) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleExpand = (id: string) => {
    setExercises(exercises.map(e => e.id === id ? { ...e, isExpanded: !e.isExpanded } : e));
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupTitle.trim()) {
      toast.error("يرجى إدخال اسم المجموعة");
      return;
    }

    const validExercises = exercises.filter(ex => ex.title.trim() !== "");
    if (validExercises.length === 0) {
      toast.error("يرجى إدخال تمرين واحد على الأقل");
      return;
    }

    startTransition(async () => {
      try {
        await createWorkoutGroup({
          title: groupTitle,
          days: selectedDays,
          exercises: validExercises.map(ex => ({
            title: ex.title,
            sets: ex.sets,
            reps: ex.reps
          }))
        });
        toast.success("تمت إضافة المجموعة بنجاح");
        setOpen(false);
        // Reset form
        setGroupTitle("");
        setSelectedDays([]);
        setExercises([{ id: crypto.randomUUID(), title: "", sets: 3, reps: 10, isExpanded: true }]);
      } catch (error) {
        toast.error("حدث خطأ أثناء إضافة المجموعة");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      {/* Update standard dialog styles for dark blur and proper border */}
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-hidden border-border bg-background/95 backdrop-blur-md" dir="rtl">
        {/* Adjusted X Button size */}
        <div className="absolute top-4 left-4 z-10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <DialogHeader className="pt-6 pb-4 px-6 border-b z-0 text-center relative">
          <DialogTitle className="text-xl font-bold w-full text-center pr-8">إضافة مجموعة تمارين جديدة</DialogTitle>
          <DialogDescription className="sr-only">
            نموذج لإضافة مجموعة تمارين جديدة مع التمارين التابعة لها
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group-title" className="text-sm font-bold">اسم مجموعة التمارين</Label>
              <Input
                id="group-title"
                placeholder="مثال: تمارين الصدر والكتف"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="h-12 bg-secondary/30 rounded-xl px-4 text-base border-transparent focus-visible:ring-0 focus-visible:border-[var(--color-workout)]"
              />
            </div>

            {/* Workout Days */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">أيام التمرين</Label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 select-none",
                        isSelected
                          ? "bg-workout text-white shadow-sm"
                          : "bg-[#F3F4F6] dark:bg-secondary/50 text-foreground hover:bg-[#E5E7EB] dark:hover:bg-secondary/70"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-3">
              <Label className="text-sm font-bold block mb-1">التمارين</Label>

              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={cn(
                      "rounded-2xl border transition-all duration-200 overflow-hidden",
                      exercise.isExpanded
                        ? "bg-secondary/10 shadow-sm border-[var(--color-workout)]"
                        : "bg-secondary/30 border-border"
                    )}
                  >
                    {/* Header Row */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExpand(exercise.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          exercise.isExpanded || exercise.title ? "bg-[var(--color-workout)] text-white" : "bg-muted-foreground/30 text-white"
                        )}>
                          {index + 1}
                        </div>
                        <span className={cn(
                          "font-bold text-sm",
                          !exercise.title && "text-muted-foreground"
                        )}>
                          {exercise.title || "تمرين جديد"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeExercise(exercise.id); }}
                            className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button type="button" className="p-1 text-muted-foreground">
                          {exercise.isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {exercise.isExpanded && (
                      <div className="p-4 pt-0 border-t border-border/50 grid grid-cols-1 sm:grid-cols-12 gap-4 animate-in slide-in-from-top-2">
                        <div className="sm:col-span-6 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">اسم التمرين</Label>
                          <Input
                            value={exercise.title}
                            onChange={(e) => updateExercise(exercise.id, "title", e.target.value)}
                            placeholder="مثال: بنش برس"
                            className="h-10 bg-background/50 border-input focus-visible:ring-0 focus-visible:border-[var(--color-workout)]"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">المجموعات</Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={exercise.sets}
                            onChange={(e) => updateExercise(exercise.id, "sets", parseInt(e.target.value) || 0)}
                            className="h-10 text-center bg-background/50 border-input focus-visible:ring-0 focus-visible:border-[var(--color-workout)]"
                            dir="ltr"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1.5">
                          <Label className="text-xs text-muted-foreground">التكرارات</Label>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={exercise.reps}
                            onChange={(e) => updateExercise(exercise.id, "reps", parseInt(e.target.value) || 0)}
                            className="h-10 text-center bg-background/50 border-input focus-visible:ring-0 focus-visible:border-[var(--color-workout)]"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Exercise Button */}
              <button
                type="button"
                onClick={addExercise}
                className="w-full mt-2 py-3.5 border-2 border-dashed border-[var(--color-workout)]/40 rounded-2xl flex items-center justify-center gap-2 text-[var(--color-workout)] font-bold hover:bg-[var(--color-workout)]/10 hover:border-[var(--color-workout)] transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--color-workout)] flex items-center justify-center text-white">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>إضافة تمرين آخر</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t bg-secondary/20 flex flex-col sm:flex-row-reverse gap-3 items-center mt-auto">
            <Button
              type="submit"
              disabled={isPending}
              variant="ghost"
              className="w-full sm:w-auto flex-1 font-bold text-base md:text-lg px-6 md:px-8 h-11 md:h-12 rounded-xl transition-transform active:scale-95 cursor-pointer bg-workout text-white shadow hover:bg-workout/90 hover:text-white dark:bg-workout/10 dark:text-workout dark:hover:bg-workout/20 dark:hover:text-workout border border-transparent dark:border-workout/30 dark:hover:border-workout/50"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "حفظ المجموعة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="w-full sm:w-24 h-12 rounded-xl font-bold border-transparent hover:bg-secondary/80 bg-background"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
