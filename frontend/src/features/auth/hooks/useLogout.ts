import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast.success('You have been logged out');
      navigate(ROUTES.LOGIN, { replace: true });
    },
    onError: () => {
      // Even if API call fails, clear local state
      authService.clearAuth();
      navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}
