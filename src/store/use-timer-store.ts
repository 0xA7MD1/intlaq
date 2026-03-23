import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getFocusStats, type FocusStats } from '@/server/actions/focus';

interface TimerState {
  timeLeft: number;
  isActive: boolean;
  isBreak: boolean;
  round: number;
  totalRounds: number;
  sessionStartTime: string | null; // ISO string
  stats: FocusStats;
  
  // Actions
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean) => void;
  setIsBreak: (isBreak: boolean) => void;
  setRound: (round: number) => void;
  setSessionStartTime: (time: Date | null) => void;
  
  tick: () => void;
  addTime: (minutes: number) => void;
  resetTimer: () => void;
  completeSession: () => void;
  fetchStats: () => Promise<void>;
}

const INITIAL_FOCUS_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 10 * 60;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timeLeft: INITIAL_FOCUS_TIME,
      isActive: false,
      isBreak: false,
      round: 1,
      totalRounds: 4,
      sessionStartTime: null,
      stats: {
        streak: 0,
        totalFocusMinutes: 0,
        totalBreakMinutes: 0,
        completedRounds: 0,
      },

      setTimeLeft: (time) => set({ timeLeft: time }),
      setIsActive: (active) => set({ isActive: active }),
      setIsBreak: (isBreak) => set({ isBreak: isBreak }),
      setRound: (round) => set({ round: round }),
      setSessionStartTime: (time) => set({ sessionStartTime: time?.toISOString() ?? null }),

      tick: () => {
        const { timeLeft, isActive } = get();
        if (isActive && timeLeft > 0) {
          set({ timeLeft: timeLeft - 1 });
        }
      },

      addTime: (minutes) => {
        set((state) => ({ timeLeft: state.timeLeft + minutes * 60 }));
      },

      resetTimer: () => {
        set({
          isActive: false,
          isBreak: false,
          timeLeft: INITIAL_FOCUS_TIME,
          round: 1,
          sessionStartTime: null,
        });
      },

      completeSession: () => {
        const { isBreak, round, totalRounds } = get();
        if (!isBreak) {
          // Finished a focus session
          const isLastRound = round === totalRounds;
          set({
            isActive: false,
            isBreak: true,
            timeLeft: isLastRound ? LONG_BREAK_TIME : SHORT_BREAK_TIME,
            sessionStartTime: null,
          });
        } else {
          // Finished a break session
          const isLastRound = round === totalRounds;
          set({
            isActive: false,
            isBreak: false,
            timeLeft: INITIAL_FOCUS_TIME,
            round: isLastRound ? 1 : round + 1,
            sessionStartTime: null,
          });
        }
      },

      fetchStats: async () => {
        try {
          const stats = await getFocusStats();
          set({ stats });
        } catch (error) {
          console.error("Failed to fetch focus stats:", error);
        }
      },
    }),
    {
      name: 'focus-timer-storage-v2', // تغيير الاسم لضمان بداية نظيفة
      storage: createJSONStorage(() => localStorage),
      // We don't want to persist the stats, they should be fresh from server
      partialize: (state) => ({
        timeLeft: state.timeLeft,
        isActive: state.isActive,
        isBreak: state.isBreak,
        round: state.round,
        totalRounds: state.totalRounds,
        sessionStartTime: state.sessionStartTime,
      }),
    }
  )
);