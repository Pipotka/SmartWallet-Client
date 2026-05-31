import { type ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { refreshAccessToken } from '@/api/client';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AuthInitGuard({ children }: ProtectedRouteProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          useAuthStore.getState().clearAuth();
          if (!cancelled && !isAuthPage) navigate('/login', { replace: true });
        }
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        if (!cancelled && !isAuthPage) navigate('/login', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });
    return () => { cancelled = true; };
  }, [navigate, location.pathname]);

  if (isInitializing) {
    return (
      <div className={styles.loadingOverlay} role="status" aria-label="Загрузка приложения">
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}
