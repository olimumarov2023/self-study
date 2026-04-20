import { apiClient } from './client';

export interface TelegramStatus {
  linked: boolean;
  botUsername: string | null;
}

export interface TelegramLinkToken {
  token: string | null;
  botUsername: string | null;
  deepLink: string | null;
  enabled: boolean;
}

export const telegramApi = {
  getStatus: () =>
    apiClient.get<TelegramStatus>('/telegram/status').then((r) => r.data),

  createLinkToken: () =>
    apiClient
      .post<TelegramLinkToken>('/telegram/link-token')
      .then((r) => r.data),

  unlink: () =>
    apiClient.delete<{ success: boolean }>('/telegram/link').then((r) => r.data),
};
