import { apiClient } from './client';

export const authApi = {
  login: (password: string) =>
    apiClient
      .post<{ accessToken: string }>('/auth/login', { password })
      .then((r) => r.data),
};
