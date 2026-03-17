import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { remindersApi } from '@/api/reminders.api';
import type { Reminder } from '@/types/reminder.types';

export const reminderKeys = {
  all: ['reminders'] as const,
  lists: () => [...reminderKeys.all, 'list'] as const,
  list: (unreadOnly?: boolean) => [...reminderKeys.lists(), { unreadOnly }] as const,
  unreadCount: () => [...reminderKeys.all, 'unread-count'] as const,
};

export function useReminders(unreadOnly?: boolean) {
  return useQuery({
    queryKey: reminderKeys.list(unreadOnly),
    queryFn: () => remindersApi.listReminders(unreadOnly ? { unread: true } : undefined),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: reminderKeys.unreadCount(),
    queryFn: () => remindersApi.getUnreadCount(),
    refetchInterval: 60_000,
  });
}

export function useGenerateDaily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => remindersApi.generateDaily(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.markRead(id),
    // Optimistic update: flip read=true in every cached list before the request lands
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: reminderKeys.all });

      const previousLists = queryClient
        .getQueriesData<Reminder[]>({ queryKey: reminderKeys.lists() });

      previousLists.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<Reminder[]>(
          queryKey,
          data.map((r) => (r.id === id ? { ...r, read: true } : r)),
        );
      });

      const previousCount = queryClient.getQueryData(reminderKeys.unreadCount());

      queryClient.setQueryData<{ count: number }>(reminderKeys.unreadCount(), (old) =>
        old ? { count: Math.max(0, old.count - 1) } : old,
      );

      return { previousLists, previousCount };
    },
    onError: (_err, _id, context) => {
      if (!context) return;
      context.previousLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      queryClient.setQueryData(reminderKeys.unreadCount(), context.previousCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}
