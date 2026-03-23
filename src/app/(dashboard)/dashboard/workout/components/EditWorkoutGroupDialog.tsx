"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, X, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getExercisesByGroup,
  updateWorkoutGroupTitle,
  addExercise as addExerciseAction,
  deleteExercise as deleteExerciseAction,
  updateExercise as updateExerciseAction,
} from "@/server/actions/workouts";
import { toast } from "sonner";

interface ExerciseItem {
  id: string;
  title: string;
  sets: number;
  reps: number;
  isNew?: boolean;
  isModified?: boolean;
  isExpanded: boolean;
}

interface EditWorkoutGroupDialogProps {
  groupId: string;
  groupTitle: string;
  children: React.ReactNode;
}

export function EditWorkoutGroupDialog({ groupId, groupTitle, children }: EditWorkoutGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(groupTitle);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);

  // Load exercises when dialog opens
  useEffect(() => {
    if (open) {
      setTitle(groupTitle);
      setIsLoading(true);
      getExercisesByGroup(groupId)
        .then((data) => {
          setExercises(
            data.map((ex, i) => ({
              ...ex,
              isExpanded: i === 0,
              isNew: false,
            }))
          );
        })
        .catch(() => toast.error("فشل تحميل التمارين"))
        .finally(() => setIsLoading(false));
    }
  }, [open, groupId, groupTitle]);

  const addNewExercise = () => {
    setExercises([
      ...exercises.map((e) => ({ ...e, isExpanded: false })),
      { id: crypto.randomUUID(), title: "", sets: 3, reps: 10, isExpanded: true, isNew: true },
    ]);
  };

  const updateExerciseField = (id: string, field: keyof ExerciseItem, value: any) => {
    setExercises(exercises.map((e) => {
      if (e.id !== id) return e;
      return { ...e, [field]: value, isModified: !e.isNew ? true : e.isModified };
    }));
  };

  const toggleExpand = (id: string) => {
    setExercises(exercises.map((e) => (e.id === id ? { ...e, isExpanded: !e.isExpanded } : e)));
  };

  const handleDeleteExercise = (exerciseId: string, isNew: boolean) => {
    if (isNew) {
      // Just remove from local state
      setExercises(exercises.filter((e) => e.id !== exerciseId));
      return;
    }

    startTransition(async () => {
      try {
        await deleteExerciseAction(exerciseId);
        setExercises(exercises.filter((e) => e.id !== exerciseId));
        toast.success("تم حذف التمرين");
      } catch {
        toast.error("فشل حذف التمرين");
      }
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        // Update title if changed
        if (title !== groupTitle) {
          await updateWorkoutGroupTitle(groupId, title);
        }

        // Update modified existing exercises
        const modifiedExercises = exercises.filter((ex) => ex.isModified && !ex.isNew);
        for (const ex of modifiedExercises) {
          await updateExerciseAction(ex.id, {
            title: ex.title,
            sets: ex.sets,
            reps: ex.reps,
          });
        }

        // Add new exercises
        const newExercises = exercises.filter((ex) => ex.isNew && ex.title.trim() !== "");
        for (const ex of newExercises) {
          await addExerciseAction(groupId, {
            title: ex.title,
            sets: ex.sets,
            reps: ex.reps,
          });
        }

        toast.success("تم حفظ التعديلات بنجاح");
        setOpen(false);
      } catch {
        toast.error("حدث خطأ أثناء الحفظ");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent showCloseButton={false} className="sm:max-w-[500px] p-0 overflow-hidden border-border bg-background/95 backdrop-blur-md" dir="rtl">
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
          <DialogTitle className="text-xl font-bold w-full text-center pr-8">تعديل مجموعة التمارين</DialogTitle>
          <DialogDescription className="sr-only">
            تعديل اسم المجموعة وإدارة التمارين التابعة لها
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col max-h-[70vh]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-group-title" className="text-sm font-bold">اسم مجموعة التمارين</Label>
                <Input
                  id="edit-group-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 bg-secondary/30 rounded-xl px-4 text-base border-transparent focus-visible:ring-0 focus-visible:border-[var(--color-workout)]"
                />
              </div>

              {/* Exercises List */}
              <div className="space-y-3">
                <Label className="text-sm font-bold block mb-1">التمارين</Label>

                {exercises.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">لا توجد تمارين في هذه المجموعة</p>
                )}

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
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              exercise.isExpanded || exercise.title
                                ? "bg-[var(--color-workout)] text-white"
                                : "bg-muted-foreground/30 text-white"
                            )}
                          >
                            {index + 1}
                          </div>
                          <span className={cn("font-bold text-sm", !exercise.title && "text-muted-foreground")}>
                            {exercise.title || "تمرين جديد"}
                          </span>
                          {exercise.isNew && (
                            <span className="text-[10px] bg-workout/15 text-workout px-2 py-0.5 rounded-full font-bold">جديد</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(exercise.id, !!exercise.isNew);
                            }}
                            disabled={isPending}
                            className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                              onChange={(e) => updateExerciseField(exercise.id, "title", e.target.value)}
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
                              onChange={(e) => updateExerciseField(exercise.id, "sets", parseInt(e.target.value) || 0)}
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
                              onChange={(e) => updateExerciseField(exercise.id, "reps", parseInt(e.target.value) || 0)}
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
                  onClick={addNewExercise}
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
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "حفظ التعديلات"}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
