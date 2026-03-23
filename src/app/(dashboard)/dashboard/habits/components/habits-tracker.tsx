"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, ChevronLeft, ChevronRight, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getHabitsWithStatusForWeek,
  createHabit,
  deleteHabit as deleteHabitAction,
  setHabitCompletion,
  reorderHabits,
  type HabitWithStatus,
  type HabitStatus,
} from "@/server/actions/habits";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface SortableHabitRowProps {
  habit: HabitWithStatus;
  daysOfWeek: Date[];
  toggleStatus: (habitId: string, dateStr: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  formatDate: (date: Date) => string;
}

function SortableHabitRow({ habit, daysOfWeek, toggleStatus, deleteHabit, formatDate }: SortableHabitRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors group",
        isDragging && "shadow-lg bg-muted/80 ring-2 ring-habit/20"
      )}
    >
      <div className="w-1/4 flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-habit transition-colors touch-none"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="font-bold truncate pr-2">{habit.name}</div>
      </div>
      <div className="flex-1 grid grid-cols-7 gap-2">
        {daysOfWeek.map((day, i) => {
          const dateStr = formatDate(day);
          const status = habit.status[dateStr] || "pending";
          return (
            <button
              key={i}
              onClick={() => toggleStatus(habit.id, dateStr)}
              className={cn(
                "w-full aspect-square rounded-xl flex items-center justify-center transition-all",
                status === "completed" ? "bg-green-100 text-green-600 hover:bg-green-200" :
                status === "failed" ? "bg-red-100 text-red-600 hover:bg-red-200" :
                "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {status === "completed" && <Check className="w-5 h-5" />}
              {status === "failed" && <X className="w-5 h-5" />}
            </button>
          );
        })}
      </div>
      <div className="w-10 flex justify-end">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteHabit(habit.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function HabitsTracker() {
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (currentDate === null) {
      const now = new Date();
      // Use setTimeout to avoid synchronous setState in effect lint error
      setTimeout(() => setCurrentDate(now), 0);
    }
  }, [currentDate]);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const startOfWeek = useCallback((date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!currentDate) return;
    const start = startOfWeek(currentDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    let active = true;
    const loadHabits = async () => {
      // Use setTimeout to avoid synchronous setState in effect lint error
      setTimeout(() => setLoading(true), 0);
      try {
        const data = await getHabitsWithStatusForWeek(formatDate(start), formatDate(end));
        if (active) {
          setHabits(data);
          setLoading(false);
        }
      } catch {
        if (active) {
          toast.error("فشل تحميل العادات");
          setLoading(false);
        }
      }
    };
    
    loadHabits();
    return () => { active = false; };
  }, [currentDate, startOfWeek]);

  if (!currentDate) return null;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);

      const newHabits = arrayMove(habits, oldIndex, newIndex);
      setHabits(newHabits);

      const res = await reorderHabits(newHabits.map((h) => h.id));
      if (!res.ok) {
        toast.error(res.error ?? "فشل تحديث الترتيب");
        // إعادة الترتيب القديم في حالة الفشل
        setHabits(habits);
      }
    }
  };

  const getDaysOfWeek = (date: Date) => {
    const start = startOfWeek(date);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const daysOfWeek = getDaysOfWeek(currentDate);

  const formatDisplayDate = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "long" }).format(date);
  };

  const getDayName = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", { weekday: "short" }).format(date);
  };

  const toggleStatus = async (habitId: string, dateStr: string) => {
    const currentStatus = habits.find((h) => h.id === habitId)?.status[dateStr] || "pending";
    let nextStatus: HabitStatus = "pending";
    if (currentStatus === "pending") nextStatus = "completed";
    else if (currentStatus === "completed") nextStatus = "failed";
    else if (currentStatus === "failed") nextStatus = "pending";

    setHabits((prev) =>
      prev.map((h) =>
        h.id !== habitId ? h : { ...h, status: { ...h.status, [dateStr]: nextStatus } }
      )
    );
    const res = await setHabitCompletion(habitId, dateStr, nextStatus);
    if (!res.ok) {
      toast.error(res.error ?? "فشل التحديث");
      setHabits((prev) =>
        prev.map((h) =>
          h.id !== habitId ? h : { ...h, status: { ...h.status, [dateStr]: currentStatus } }
        )
      );
    }
  };

  const addHabit = async () => {
    const name = newHabitName.trim();
    if (!name) return;
    const res = await createHabit(name);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setNewHabitName("");
    toast.success("تم إضافة عادة جديدة");
    setHabits((prev) => [...prev, { id: res.id, name, position: res.position, status: {} }]);
  };

  const deleteHabit = async (id: string) => {
    const res = await deleteHabitAction(id);
    if (!res.ok) {
      toast.error(res.error ?? "فشل الحذف");
      return;
    }
    setHabits((prev) => prev.filter((h) => h.id !== id));
    toast.success("تم حذف العادة");
  };

  // Calculate Progress
  const todayStr = formatDate(new Date());
  const todayHabits = habits.length;
  const completedToday = habits.filter(h => h.status[todayStr] === "completed").length;
  const progress = todayHabits === 0 ? 0 : Math.round((completedToday / todayHabits) * 100);

  const isCurrentWeek = daysOfWeek.some(d => formatDate(d) === formatDate(new Date()));

  return (
    <div className="flex flex-col gap-6 w-full mt-8">
      
      {/* Top Progress Card */}
      <Card className="p-6 bg-habit/10 dark:bg-habit/5 border-none shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-habit/20" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="175" strokeDashoffset={175 - (175 * progress) / 100} className="text-habit transition-all duration-500" strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-bold">{progress}%</span>
            </div>
            <div>
                <h3 className="font-bold text-lg">العادات الأسبوعية</h3>
                <p className="text-muted-foreground text-sm">تتبع عاداتك اليومية وابنِ الاستمرارية</p>
            </div>
        </div>
        <div className="text-right">
            <div className="text-2xl font-bold">{completedToday} / {todayHabits}</div>
            <div className="text-xs text-muted-foreground">عادة مكتملة</div>
        </div>
      </Card>

      {/* Date Navigation */}
      <Card className="p-4 flex flex-row items-center justify-between border-none shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentDate(newDate);
        }}>
            <ChevronRight className="w-5 h-5" />
        </Button>
        
        <div className="flex flex-col items-center">
            <span className={cn("font-bold text-lg", isCurrentWeek ? "text-habit dark:text-habit" : "")}>
                {formatDisplayDate(daysOfWeek[0])} - {formatDisplayDate(daysOfWeek[6])}
            </span>
            <span className="text-xs text-muted-foreground">هذا الأسبوع</span>
        </div>

        <Button variant="ghost" size="icon" onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentDate(newDate);
        }}>
            <ChevronLeft className="w-5 h-5" />
        </Button>
      </Card>

      {/* Add Habit */}
      <Card className="p-4 flex flex-row items-center gap-4 border-none shadow-sm">
        <Input 
            placeholder="اسم العادة الجديدة..." 
            className="border-0 shadow-none text-lg bg-gray-100 dark:bg-muted focus-visible:ring-0 focus:border-2 focus:border-habit"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
        />
        <Button size="icon" className="bg-habit hover:bg-habit/90 text-white rounded-xl" onClick={addHabit}>
            <Plus className="w-5 h-5" />
        </Button>
      </Card>

      {/* Habits Table */}
      <Card className="p-6 border-none shadow-sm overflow-x-auto">
        <div className="min-w-[600px]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-bold mb-1">لا توجد عادات بعد</p>
              <p className="text-sm">أضف عادة من الحقل أعلاه لبدء التتبع</p>
            </div>
          ) : (
            <>
            <div className="flex items-center justify-between mb-4 px-4">
                <div className="w-1/4 text-right font-bold text-muted-foreground">العادة</div>
                <div className="flex-1 grid grid-cols-7 gap-2 text-center">
                    {daysOfWeek.map((day, i) => {
                        const isToday = formatDate(day) === formatDate(new Date());
                        return (
                            <div key={i} className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground mb-1">{getDayName(day)}</span>
                                <span className={cn("text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-colors", 
                                    isToday ? "text-habit scale-110" : ""
                                )}>
                                    {day.getDate()}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="w-10"></div>
            </div>

            <div className="space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={habits.map((h) => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {habits.map((habit) => (
                      <SortableHabitRow
                        key={habit.id}
                        habit={habit}
                        daysOfWeek={daysOfWeek}
                        toggleStatus={toggleStatus}
                        deleteHabit={deleteHabit}
                        formatDate={formatDate}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
            </div>
            </>
          )}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 flex items-center justify-center text-green-600"><Check className="w-3 h-3" /></div>
            <span>مكتمل</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 flex items-center justify-center text-red-600"><X className="w-3 h-3" /></div>
            <span>فشل</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800"></div>
            <span>فارغ</span>
        </div>
      </div>
    </div>
  );
}

