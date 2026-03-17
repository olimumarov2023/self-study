import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (password: string) => authApi.login(password),
    onSuccess: (data) => {
      setToken(data.accessToken);
      navigate('/dashboard', { replace: true });
    },
  });
}
