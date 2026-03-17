import { apiClient } from './client';

import type { Reminder, UnreadCountResponse } from '@/types/reminder.types';

export const remindersApi = {
  generateDaily: () =>
    apiClient
      .post<Reminder>('/reminders/generate-daily')
      .then((r) => r.data),

  generateSpacedRepAlert: () =>
    apiClient
      .post<Reminder>('/reminders/generate-spaced-rep')
      .then((r) => r.data),

  listReminders: (params?: { unread?: boolean }) =>
    apiClient
      .get<Reminder[]>('/reminders', { params })
      .then((r) => r.data),

  getUnreadCount: () =>
    apiClient
      .get<UnreadCountResponse>('/reminders/unread-count')
      .then((r) => r.data),

  markRead: (id: string) =>
    apiClient
      .patch<Reminder>(`/reminders/${id}/read`)
      .then((r) => r.data),
};
