import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/axios';
import { ROUTES } from '@/lib/constants';
import type { LoginCredentials } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.firstName}!`);
      navigate(ROUTES.DASHBOARD, { replace: true });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
}
