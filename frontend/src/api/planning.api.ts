import { apiClient } from './client';

import type {
  PlanAssignment,
  AssignPayload,
  ReorderPayload,
  AutoDistributePayload,
  AutoDistributeResponse,
} from '@/types/planning.types';

export const planningApi = {
  assign: (data: AssignPayload) =>
    apiClient
      .post<PlanAssignment>('/planning/assign', data)
      .then((r) => r.data),

  getMonth: (yyyyMM: string) =>
    apiClient
      .get<PlanAssignment[]>(`/planning/month/${yyyyMM}`)
      .then((r) => r.data),

  getWeek: (yyyyWww: string) =>
    apiClient
      .get<PlanAssignment[]>(`/planning/week/${yyyyWww}`)
      .then((r) => r.data),

  getDay: (yyyyMMdd: string) =>
    apiClient
      .get<PlanAssignment[]>(`/planning/day/${yyyyMMdd}`)
      .then((r) => r.data),

  reorder: (data: ReorderPayload) =>
    apiClient
      .patch<{ updated: number }>('/planning/reorder', data)
      .then((r) => r.data),

  autoDistribute: (data: AutoDistributePayload) =>
    apiClient
      .post<AutoDistributeResponse>('/planning/auto-distribute', data)
      .then((r) => r.data),
};
