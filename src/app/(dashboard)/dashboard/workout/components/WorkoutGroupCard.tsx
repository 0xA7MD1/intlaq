"use client";

import { Trash2, Play } from "lucide-react";
import { EditWorkoutGroupDialog } from "./EditWorkoutGroupDialog";
import { WorkoutSessionDialog } from "./WorkoutSessionDialog";

export interface WorkoutGroupCardProps {
  id: string;
  title: string;
  exercisesCount: number;
  durationMinutes: number;
  icon: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function WorkoutGroupCard({
  id,
  title,
  exercisesCount,
  icon,
  onDelete,
}: WorkoutGroupCardProps) {
  return (
    <div dir="rtl" className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-[#0B1527] p-3 sm:p-[18px] lg:p-7 shadow-sm dark:shadow-none hover:shadow-md transition-shadow">
      {/* Top area: Icon (right) and Trash (left) */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-[1rem] bg-[#F2F8FB] dark:bg-gray-800 flex items-center justify-center text-2xl">
          {icon}
        </div>

        <button
          onClick={() => onDelete?.(id)}
          className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Middle: Title and Exercise Count - right aligned */}
      <div className="flex flex-col items-start mb-6 gap-1.5">
        <h3 className="text-xl font-bold text-[#0B1527] dark:text-white">{title}</h3>
        <p className="text-sm text-[#848F9F] dark:text-gray-400">
          {exercisesCount} تمارين
        </p>
      </div>

      {/* Bottom: Buttons */}
      <div className="flex flex-col gap-2.5">
        <WorkoutSessionDialog groupId={id} groupTitle={title} groupIcon={icon}>
          <button className="w-full py-3.5 rounded-2xl bg-workout text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-workout/90 dark:bg-workout/10 dark:text-workout dark:hover:bg-workout/20 dark:border dark:border-workout/30 transition-all active:scale-[0.98]">
            <Play className="w-4 h-4 fill-current" />
            بدء التمرين
          </button>
        </WorkoutSessionDialog>

        <EditWorkoutGroupDialog groupId={id} groupTitle={title}>
          <button className="w-full py-3 rounded-2xl bg-[#F4F6F8] dark:bg-gray-800 text-[#0B1527] dark:text-white font-bold text-sm hover:bg-[#E2E8F0] dark:hover:bg-gray-700 transition-colors">
            تعديل المجموعة
          </button>
        </EditWorkoutGroupDialog>
      </div>
    </div>
  );
}


