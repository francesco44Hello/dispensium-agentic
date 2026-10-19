import type { AuthStatus } from '../services/authService';

export type GuardDecision = 'loading' | 'redirect' | 'render';

export function getGuardDecision(status: AuthStatus): GuardDecision {
  if (status === 'loading') return 'loading';
  return status === 'authenticated' ? 'render' : 'redirect';
}
