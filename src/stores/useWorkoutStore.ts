import { create } from 'zustand';
import type { WorkoutSession } from '@/db/types';

interface WorkoutState {
  activeSession: WorkoutSession | null;
  elapsedSeconds: number;
  restSecondsRemaining: number;
  restTimerRunning: boolean;
  setActiveSession: (session: WorkoutSession | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  tickElapsed: () => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  stopRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: null,
  elapsedSeconds: 0,
  restSecondsRemaining: 0,
  restTimerRunning: false,
  setActiveSession: (activeSession) => set({ activeSession }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),
  tickElapsed: () => set((s) => (s.activeSession ? { elapsedSeconds: s.elapsedSeconds + 1 } : s)),
  startRestTimer: (seconds) => set({ restSecondsRemaining: seconds, restTimerRunning: true }),
  tickRestTimer: () =>
    set((s) => {
      if (!s.restTimerRunning) return s;
      if (s.restSecondsRemaining <= 1) {
        return { restSecondsRemaining: 0, restTimerRunning: false };
      }
      return { restSecondsRemaining: s.restSecondsRemaining - 1 };
    }),
  stopRestTimer: () => set({ restSecondsRemaining: 0, restTimerRunning: false }),
}));
