import { describe, it, expect } from 'vitest';
import { getGuardDecision } from '../utils/authGuard';

describe('getGuardDecision', () => {
  it('shows the loader while auth state is resolving', () => {
    expect(getGuardDecision('loading')).toBe('loading');
  });

  it('renders children for an authenticated user', () => {
    expect(getGuardDecision('authenticated')).toBe('render');
  });

  it('redirects an unauthenticated user', () => {
    expect(getGuardDecision('unauthenticated')).toBe('redirect');
  });
});
