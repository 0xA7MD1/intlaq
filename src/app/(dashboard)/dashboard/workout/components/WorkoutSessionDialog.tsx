"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { X, Loader2, Check, RotateCcw, Dumbbell, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getExercisesByGroup, logWorkout } from "@/server/actions/workouts";
import { toast } from "sonner";

interface ExerciseSession {
  id: string;
  title: string;
  sets: number;
  reps: number;
  actualReps: number;
  status: "pending" | "done" | "skipped";
}

interface WorkoutSessionDialogProps {
  groupId: string;
  groupTitle: string;
  groupIcon: string;
  children: React.ReactNode;
}

export function WorkoutSessionDialog({
  groupId,
  groupTitle,
  groupIcon,
  children,
}: WorkoutSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState<ExerciseSession[]>([]);

  const today = new Date();
  const dateStr = today.toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const isoDate = today.toISOString().split("T")[0];

  // Load exercises when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getExercisesByGroup(groupId)
        .then((data) => {
          setExercises(
            data.map((ex) => ({
              ...ex,
              actualReps: ex.sets * ex.reps,
              status: "pending" as const,
            }))
          );
        })
        .catch(() => toast.error("فشل تحميل التمارين"))
        .finally(() => setIsLoading(false));
    }
  }, [open, groupId]);

  const markDone = useCallback((id: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === id ? { ...ex, status: "done" as const } : ex
      )
    );
  }, []);

  const markSkipped = useCallback((id: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === id ? { ...ex, status: "skipped" as const } : ex
      )
    );
  }, []);

  const resetExercise = useCallback((id: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === id ? { ...ex, status: "pending" as const } : ex
      )
    );
  }, []);

  const updateActualReps = useCallback((id: string, value: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === id ? { ...ex, actualReps: value } : ex
      )
    );
  }, []);

  const completedCount = exercises.filter((ex) => ex.status === "done").length;
  const totalCount = exercises.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await logWorkout(groupId, isoDate);
        toast.success("تم حفظ الجلسة بنجاح! 💪");
        setOpen(false);
      } catch {
        toast.error("حدث خطأ أثناء حفظ الجلسة");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[520px] p-0 overflow-hidden border-border bg-background/95 backdrop-blur-md"
        dir="rtl"
      >
        {/* Close Button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <DialogHeader className="pt-6 pb-4 px-6 border-b text-center relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">{groupIcon}</span>
            <DialogTitle className="text-xl font-bold">جلسة التمرين</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {dateStr}
          </DialogDescription>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">التقدم</span>
                <span className="text-workout">{completedCount}/{totalCount} تمارين</span>
              </div>
              <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-workout transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Dumbbell className="w-10 h-10" />
            <p className="text-sm font-medium">لا توجد تمارين في هذه المجموعة</p>
          </div>
        ) : (
          <div className="flex flex-col max-h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={cn(
                    "rounded-2xl border p-4 transition-all duration-300",
                    exercise.status === "done" &&
                      "bg-workout/5 dark:bg-workout/10 border-workout/30",
                    exercise.status === "skipped" &&
                      "bg-secondary/30 border-border opacity-50",
                    exercise.status === "pending" &&
                      "bg-white dark:bg-secondary/10 border-border"
                  )}
                >
                  {/* Exercise Info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-bold text-base",
                        exercise.status === "done" && "text-workout",
                        exercise.status === "skipped" && "line-through text-muted-foreground"
                      )}>
                        {exercise.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        الهدف: {exercise.sets} × {exercise.reps} = {exercise.sets * exercise.reps} تكرار
                      </p>
                    </div>
                    {exercise.status === "done" && (
                      <div className="w-8 h-8 rounded-full bg-workout/15 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-workout" />
                      </div>
                    )}
                  </div>

                  {/* Actual Reps Input + Action Buttons */}
                  {exercise.status === "pending" && (
                    <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-1">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground">
                          التكرارات الفعلية
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={exercise.actualReps}
                          onChange={(e) =>
                            updateActualReps(exercise.id, parseInt(e.target.value) || 0)
                          }
                          dir="ltr"
                          className="w-full h-11 rounded-xl border border-border bg-secondary/20 px-4 text-center text-base font-bold focus:outline-none focus:border-workout focus:ring-1 focus:ring-workout/30 transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markDone(exercise.id)}
                          className="flex-1 h-10 rounded-xl bg-workout text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-workout/90 dark:bg-workout/15 dark:text-workout dark:hover:bg-workout/25 dark:border dark:border-workout/30 transition-all active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          تم
                        </button>
                        <button
                          type="button"
                          onClick={() => markSkipped(exercise.id)}
                          className="h-10 px-4 rounded-xl border border-border bg-secondary/30 text-muted-foreground font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-secondary/60 transition-all active:scale-95"
                        >
                          <X className="w-4 h-4" />
                          تخطي
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset button for done/skipped */}
                  {exercise.status !== "pending" && (
                    <button
                      type="button"
                      onClick={() => resetExercise(exercise.id)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      إعادة
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t bg-secondary/20 mt-auto">
              <Button
                onClick={handleSave}
                disabled={isPending || completedCount === 0}
                variant="ghost"
                className="w-full font-bold text-base md:text-lg h-12 rounded-xl transition-transform active:scale-95 cursor-pointer bg-workout text-white shadow hover:bg-workout/90 hover:text-white dark:bg-workout/10 dark:text-workout dark:hover:bg-workout/20 dark:hover:text-workout border border-transparent dark:border-workout/30 dark:hover:border-workout/50 disabled:opacity-40"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  `حفظ الجلسة (${completedCount}/${totalCount})`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
