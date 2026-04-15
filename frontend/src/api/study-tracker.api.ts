import { apiClient } from './client';

import type {
  StudyBook,
  StudyChapter,
  StudyTopic,
  CreateBookPayload,
  UpdateBookPayload,
  CreateChapterPayload,
  UpdateChapterPayload,
  CreateTopicPayload,
  UpdateTopicPayload,
} from '@/types/study-tracker.types';

export const studyTrackerApi = {
  listBooks: () =>
    apiClient
      .get<StudyBook[]>('/study-tracker')
      .then((r) => r.data),

  getBook: (id: string) =>
    apiClient
      .get<StudyBook>(`/study-tracker/${id}`)
      .then((r) => r.data),

  createBook: (payload: CreateBookPayload) =>
    apiClient
      .post<StudyBook>('/study-tracker', payload)
      .then((r) => r.data),

  updateBook: (id: string, payload: UpdateBookPayload) =>
    apiClient
      .patch<StudyBook>(`/study-tracker/${id}`, payload)
      .then((r) => r.data),

  deleteBook: (id: string) =>
    apiClient
      .delete<void>(`/study-tracker/${id}`)
      .then((r) => r.data),

  createChapter: (bookId: string, payload: CreateChapterPayload) =>
    apiClient
      .post<StudyChapter>(`/study-tracker/${bookId}/chapters`, payload)
      .then((r) => r.data),

  updateChapter: (id: string, payload: UpdateChapterPayload) =>
    apiClient
      .patch<StudyChapter>(`/study-tracker/chapters/${id}`, payload)
      .then((r) => r.data),

  deleteChapter: (id: string) =>
    apiClient
      .delete<void>(`/study-tracker/chapters/${id}`)
      .then((r) => r.data),

  createTopic: (chapterId: string, payload: CreateTopicPayload) =>
    apiClient
      .post<StudyTopic>(`/study-tracker/chapters/${chapterId}/topics`, payload)
      .then((r) => r.data),

  updateTopic: (id: string, payload: UpdateTopicPayload) =>
    apiClient
      .patch<StudyTopic>(`/study-tracker/topics/${id}`, payload)
      .then((r) => r.data),

  deleteTopic: (id: string) =>
    apiClient
      .delete<void>(`/study-tracker/topics/${id}`)
      .then((r) => r.data),

  toggleTopicLearned: (id: string) =>
    apiClient
      .patch<StudyTopic>(`/study-tracker/topics/${id}/toggle-learned`)
      .then((r) => r.data),

  exportBook: async (id: string, fileName: string) => {
    const response = await apiClient.get(`/study-tracker/${id}/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
