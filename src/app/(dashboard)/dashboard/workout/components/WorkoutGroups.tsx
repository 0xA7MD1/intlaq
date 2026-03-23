"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { WorkoutGroupCard } from "./WorkoutGroupCard";
import { NewWorkoutGroupDialog } from "./NewWorkoutGroupDialog";
import { deleteWorkoutGroup } from "@/server/actions/workouts";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkoutGroup {
  id: string;
  title: string;
  exercisesCount: number;
  durationMinutes: number;
  icon: string;
}

export function WorkoutGroups({ groups }: { groups: WorkoutGroup[] }) {
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteGroup = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      try {
        await deleteWorkoutGroup(deleteTarget.id);
        toast.success("تم حذف المجموعة بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء الحذف");
      } finally {
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="w-full mt-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* Header section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0B1527] dark:text-white">مجموعة التمارين</h2>
        
        <NewWorkoutGroupDialog>
          <button 
            disabled={isPending}
            className="flex items-center gap-2 bg-[#FD2B5B] dark:bg-workout hover:bg-[#E51E4E] dark:hover:bg-workout/90 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>إضافة مجموعة</span>
          </button>
        </NewWorkoutGroupDialog>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <WorkoutGroupCard 
            key={group.id} 
            {...group} 
            onDelete={(id) => setDeleteTarget({ id, title: group.title })}
          />
        ))}
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">حذف المجموعة</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              هل أنت متأكد من حذف مجموعة <strong>&quot;{deleteTarget?.title}&quot;</strong>؟ سيتم حذف جميع التمارين المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel 
              disabled={isPending}
              className="rounded-xl font-bold"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isPending}
              variant="destructive"
              className="rounded-xl font-bold"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              حذف المجموعة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

