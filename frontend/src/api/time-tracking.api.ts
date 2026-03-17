import { apiClient } from './client';

import type {
  StudySession,
  StartSessionPayload,
  StopSessionPayload,
  ManualSessionPayload,
  SessionsQuery,
} from '@/types/time-tracking.types';

export const timeTrackingApi = {
  start: (data: StartSessionPayload) =>
    apiClient.post<StudySession>('/time/sessions/start', data).then((r) => r.data),

  stop: (id: string, data?: StopSessionPayload) =>
    apiClient.post<StudySession>(`/time/sessions/${id}/stop`, data ?? {}).then((r) => r.data),

  manual: (data: ManualSessionPayload) =>
    apiClient.post<StudySession>('/time/sessions/manual', data).then((r) => r.data),

  getSessions: (params?: SessionsQuery) =>
    apiClient.get<StudySession[]>('/time/sessions', { params }).then((r) => r.data),

  getActive: () =>
    apiClient.get<StudySession | null>('/time/sessions/active').then((r) => r.data),
};
