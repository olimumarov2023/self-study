import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { telegramApi } from '@/api/telegram.api';

export const telegramKeys = {
  all: ['telegram'] as const,
  status: () => [...telegramKeys.all, 'status'] as const,
};

export function useTelegramStatus() {
  return useQuery({
    queryKey: telegramKeys.status(),
    queryFn: () => telegramApi.getStatus(),
    refetchInterval: (query) =>
      query.state.data?.linked ? false : 5_000,
  });
}

export function useCreateTelegramLinkToken() {
  return useMutation({
    mutationFn: () => telegramApi.createLinkToken(),
  });
}

export function useUnlinkTelegram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => telegramApi.unlink(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: telegramKeys.all });
    },
  });
}
