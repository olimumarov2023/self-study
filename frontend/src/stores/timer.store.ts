import { create } from 'zustand';

interface TimerState {
  activeSessionId: string | null;
  startedAt: string | null;
  elapsed: number;
  learningItemId: string | undefined;
  learningItemTitle: string | undefined;
  intervalId: ReturnType<typeof setInterval> | null;

  startTimer: (
    sessionId: string,
    startedAt: string,
    learningItemId?: string,
    learningItemTitle?: string,
  ) => void;
  stopTimer: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  activeSessionId: null,
  startedAt: null,
  elapsed: 0,
  learningItemId: undefined,
  learningItemTitle: undefined,
  intervalId: null,

  startTimer: (sessionId, startedAt, learningItemId, learningItemTitle) => {
    const state = get();
    // Clear any existing interval
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    // Calculate initial elapsed from startedAt
    const initialElapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000,
    );

    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({
      activeSessionId: sessionId,
      startedAt,
      elapsed: Math.max(0, initialElapsed),
      learningItemId,
      learningItemTitle,
      intervalId,
    });
  },

  stopTimer: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({
      activeSessionId: null,
      startedAt: null,
      elapsed: 0,
      learningItemId: undefined,
      learningItemTitle: undefined,
      intervalId: null,
    });
  },

  tick: () => {
    const { startedAt } = get();
    if (startedAt) {
      const elapsed = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      );
      set({ elapsed: Math.max(0, elapsed) });
    }
  },
}));
