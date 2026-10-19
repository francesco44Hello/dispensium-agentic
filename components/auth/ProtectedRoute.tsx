'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getGuardDecision } from '../../utils/authGuard';
import styles from './ProtectedRoute.module.css';

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: string;
};

export function ProtectedRoute({ children, redirectTo = '/login' }: ProtectedRouteProps) {
  const { status } = useAuth();
  const router = useRouter();
  const decision = getGuardDecision(status);

  useEffect(() => {
    if (decision === 'redirect') router.replace(redirectTo);
  }, [decision, redirectTo, router]);

  if (decision === 'render') return <>{children}</>;

  return (
    <div role="status" aria-label="Checking your session" className={styles.loader}>
      <span className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
