// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

import { AuthProvider } from '../components/auth/AuthProvider';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { createAuthService, type AuthBackend } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

afterEach(() => {
  cleanup();
  replace.mockReset();
});

const Protected = ({ service }: { service: ReturnType<typeof createAuthService> }) => (
  <AuthProvider service={service}>
    <ProtectedRoute>
      <p>secret home</p>
    </ProtectedRoute>
  </AuthProvider>
);

describe('ProtectedRoute', () => {
  it('shows a loader while auth state is still resolving', () => {
    const neverResolves: AuthBackend = {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      updateDisplayName: vi.fn(),
      onUserChange: () => () => {},
    };
    render(<Protected service={createAuthService(neverResolves)} />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('secret home')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated visitor to /welcome and hides children', async () => {
    render(<Protected service={createAuthService(createMockAuthBackend())} />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/welcome'));
    expect(screen.queryByText('secret home')).toBeNull();
  });

  it('renders children for an authenticated user', async () => {
    const service = createAuthService(createMockAuthBackend());
    await service.signUp('a@b.co', 'secret123', 'Ana');
    render(<Protected service={service} />);
    expect(await screen.findByText('secret home')).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
