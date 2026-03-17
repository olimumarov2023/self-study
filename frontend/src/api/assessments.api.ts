import { apiClient } from './client';

import type {
  GenerateAssessmentPayload,
  GenerateAssessmentResponse,
  AssessmentResponse,
  SubmitAssessmentPayload,
  SubmitAssessmentResponse,
  AssessmentResultsResponse,
  AssessmentHistoryQuery,
  AssessmentHistoryResponse,
} from '@/types/assessment.types';

export const assessmentsApi = {
  generate: (data: GenerateAssessmentPayload) =>
    apiClient
      .post<GenerateAssessmentResponse>('/assessments/generate', data)
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<AssessmentResponse>(`/assessments/${id}`)
      .then((r) => r.data),

  submit: (id: string, data: SubmitAssessmentPayload) =>
    apiClient
      .post<SubmitAssessmentResponse>(`/assessments/${id}/submit`, data)
      .then((r) => r.data),

  getResults: (id: string) =>
    apiClient
      .get<AssessmentResultsResponse>(`/assessments/${id}/results`)
      .then((r) => r.data),

  getHistory: (params: AssessmentHistoryQuery) =>
    apiClient
      .get<AssessmentHistoryResponse>('/assessments/history', { params })
      .then((r) => r.data),
};
