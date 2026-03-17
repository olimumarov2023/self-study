import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { timeTrackingApi } from '@/api/time-tracking.api';
import { useTimerStore } from '@/stores/timer.store';

import type {
  StartSessionPayload,
  StopSessionPayload,
  ManualSessionPayload,
  SessionsQuery,
} from '@/types/time-tracking.types';

export const timeTrackingKeys = {
  all: ['time-tracking'] as const,
  sessions: () => [...timeTrackingKeys.all, 'sessions'] as const,
  sessionList: (query?: SessionsQuery) => [...timeTrackingKeys.sessions(), query] as const,
  active: () => [...timeTrackingKeys.all, 'active'] as const,
};

export function useActiveSession() {
  const { startTimer } = useTimerStore.getState();

  return useQuery({
    queryKey: timeTrackingKeys.active(),
    queryFn: async () => {
      const session = await timeTrackingApi.getActive();
      // Restore timer state if there's an active session
      if (session) {
        startTimer(
          session.id,
          session.startedAt,
          session.learningItemId ?? undefined,
          session.learningItem?.title,
        );
      }
      return session;
    },
    staleTime: 30_000,
  });
}

export function useSessions(query?: SessionsQuery) {
  return useQuery({
    queryKey: timeTrackingKeys.sessionList(query),
    queryFn: () => timeTrackingApi.getSessions(query),
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartSessionPayload) => timeTrackingApi.start(data),
    onSuccess: (session) => {
      // Start the local timer with the returned session
      useTimerStore.getState().startTimer(
        session.id,
        session.startedAt,
        session.learningItemId ?? undefined,
        session.learningItem?.title,
      );
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.sessions() });
    },
  });
}

export function useStopSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: StopSessionPayload }) =>
      timeTrackingApi.stop(id, data),
    onSuccess: () => {
      // Clear the local timer
      useTimerStore.getState().stopTimer();
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.active() });
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.sessions() });
    },
  });
}

export function useManualSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ManualSessionPayload) => timeTrackingApi.manual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeTrackingKeys.sessions() });
    },
  });
}
