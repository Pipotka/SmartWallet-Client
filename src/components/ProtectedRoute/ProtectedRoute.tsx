import { type ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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

  useEffect(() => {
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          useAuthStore.getState().clearAuth();
        }
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  if (isInitializing) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}
