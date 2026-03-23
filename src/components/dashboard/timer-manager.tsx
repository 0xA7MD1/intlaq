"use client";

import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/use-timer-store";
import { saveFocusSession } from "@/server/actions/focus";
import { toast } from "sonner";

export function TimerManager() {
  const { 
    isActive, 
    timeLeft, 
    isBreak, 
    sessionStartTime, 
    tick, 
    completeSession,
    fetchStats 
  } = useTimerStore();
  
  const tickRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        if (tickRef.current) tickRef.current();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Handle completion
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      const handleComplete = async () => {
        const now = new Date();
        const startTime = sessionStartTime ? new Date(sessionStartTime) : new Date(now.getTime() - (isBreak ? 5 * 60 : 25 * 60) * 1000);
        
        try {
          // Save the COMPLETED session to DB
          await saveFocusSession({
            type: isBreak ? "break" : "focus",
            startTime,
            endTime: now,
          });
          
          if (!isBreak) {
            toast.success("انتهت جلسة التركيز! خذ استراحة ☕");
          } else {
            toast.success("انتهت الاستراحة! لنعد للعمل 🚀");
          }
          
          completeSession();
          fetchStats();
        } catch (error) {
          console.error("Failed to save session:", error);
          toast.error("فشل حفظ الجلسة في قاعدة البيانات");
          completeSession();
          fetchStats();
        }
      };

      handleComplete();
    }
  }, [isActive, timeLeft, isBreak, sessionStartTime, completeSession, fetchStats]);

  return null;
}
