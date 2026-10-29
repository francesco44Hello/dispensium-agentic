'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { getGuardDecision } from '../../utils/authGuard';
import styles from './ProtectedRoute.module.css';
import { useLocale } from '../i18n/LocaleProvider';

type ProtectedRouteProps = {
  children: ReactNode;
  redirectTo?: string;
};

export function ProtectedRoute({ children, redirectTo = '/welcome' }: ProtectedRouteProps) {
  const { t } = useLocale();
  const { status } = useAuth();
  const router = useRouter();
  const decision = getGuardDecision(status);

  useEffect(() => {
    if (decision === 'redirect') router.replace(redirectTo);
  }, [decision, redirectTo, router]);

  if (decision === 'render') return <>{children}</>;

  return (
    <div role="status" aria-label={t('auth.checkingSession')} className={styles.loader}>
      <span className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
