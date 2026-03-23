"use client";

import { Play, Pause, RotateCcw, Flame, Clock, Trophy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimerStore } from "@/store/use-timer-store";

export function FocusTimer() {
  const {
    timeLeft,
    isActive,
    isBreak,
    round,
    totalRounds,
    setIsActive,
    setSessionStartTime,
    addTime,
    resetTimer,
    stats: statsData,
  } = useTimerStore();

  const toggleTimer = () => {
    const nextActive = !isActive;
    setIsActive(nextActive);
    if (nextActive) {
      setSessionStartTime(new Date());
    }
  };

  const handleReset = () => {
    resetTimer();
    toast.info("تم إعادة ضبط المؤقت");
  };

  const handleAddTime = (minutes: number) => {
    addTime(minutes);
    toast.success(`تم إضافة ${minutes} دقائق`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const stats = [
    { 
      label: "سلسلة الأيام", 
      value: statsData.streak.toString(), 
      icon: Flame, 
      color: "text-[var(--color-workout)]" 
    },
    { 
      label: "وقت التركيز", 
      value: `${statsData.totalFocusMinutes} دقيقة`, 
      icon: Clock, 
      color: "text-blue-500" 
    },
    { 
      label: "وقت الراحة", 
      value: `${statsData.totalBreakMinutes} دقيقة`, 
      icon: Clock, 
      color: "text-blue-500" 
    },
    { 
      label: "الجولات", 
      value: statsData.completedRounds.toString(), 
      icon: Trophy, 
      color: "text-[var(--color-primary)]" 
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={cn("p-6 flex flex-col items-center justify-center text-center shadow-sm border-none bg-card")}>
            <div className="flex items-center gap-2 mb-2">
               <span className="text-3xl font-bold tabular-nums">{stat.value}</span>
               <div className={"p-2"}>
                 <stat.icon className={cn("w-5 h-5", stat.color)} />
               </div>
            </div>
            <span className="text-muted-foreground text-sm font-medium">{stat.label}</span>
          </Card>
        ))}
      </div>

      {/* Main Timer Card */}
      <Card className="bg-habit/10 dark:bg-habit/5 border-none shadow-none rounded-[2rem] p-12 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
        
        {/* Focus Time Badge */}
        <div className="bg-habit/20 dark:bg-habit/30 text-habit px-4 py-2 rounded-full flex items-center gap-2 mb-8">
            <Clock className="w-4 h-4" />
            <span className="font-bold text-sm">
                {isBreak ? "وقت الراحة" : "وقت التركيز"}
            </span>
        </div>

        {/* Circular Timer Display */}
        <div className="relative w-80 h-80 flex items-center justify-center mb-8">
            {/* Background Circle */}
            <div className="absolute inset-0 rounded-full border-8 border-white dark:border-white/10 opacity-50"></div>
            
            {/* Inner Content */}
            <div className="bg-white dark:bg-card rounded-full w-64 h-64 flex flex-col items-center justify-center shadow-sm z-10">
                <span className="text-7xl font-black tabular-nums tracking-tight text-foreground">
                    {formatTime(timeLeft)}
                </span>
                <span className="text-muted-foreground mt-2 font-medium">
                    {isBreak ? "استراحة قصيرة" : `الجولة ${round} من ${totalRounds}`}
                </span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
                <Button 
                    onClick={toggleTimer}
                    size="icon"
                    className="w-16 h-16 rounded-full bg-habit hover:bg-habit/90 dark:bg-habit/15 text-white shadow-lg transition-all hover:scale-105"
                >
                    {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </Button>
                
                <Button
                    onClick={handleReset}
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full border-none bg-white/50 hover:bg-white dark:bg-card/50 dark:hover:bg-card transition-all"
                >
                    <RotateCcw className="w-5 h-5" />
                </Button>
            </div>

            {/* Add Time Buttons (Only in Focus Mode) */}
            {!isBreak && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
                    <Button 
                        onClick={() => handleAddTime(1)}
                        variant="ghost" 
                        size="sm"
                        className="bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40 rounded-full px-4 text-xs font-bold"
                    >
                        <Plus className="w-3 h-3 ml-1" />
                        1 دقيقة
                    </Button>
                    <Button 
                        onClick={() => handleAddTime(5)}
                        variant="ghost" 
                        size="sm"
                        className="bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40 rounded-full px-4 text-xs font-bold"
                    >
                        <Plus className="w-3 h-3 ml-1" />
                        5 دقائق
                    </Button>
                </div>
            )}
        </div>
      </Card>
    </div>
  );
}
