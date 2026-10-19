// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

import { AuthProvider } from '../components/auth/AuthProvider';
import { AuthForm } from '../components/auth/AuthForm';
import { AuthError, createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

afterEach(() => {
  cleanup();
  replace.mockReset();
});

const renderForm = (mode: 'login' | 'signup') => {
  const service = createAuthService(createMockAuthBackend());
  render(
    <AuthProvider service={service}>
      <AuthForm mode={mode} />
    </AuthProvider>,
  );
  return service;
};

describe('AuthForm Google button', () => {
  it('signs in with Google on the login page and redirects home', async () => {
    const service = renderForm('login');
    const spy = vi.spyOn(service, 'signInWithGoogle');

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('is also shown on the sign-up page', () => {
    renderForm('signup');
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy();
  });

  it('shows an error when Google sign-in fails', async () => {
    const service = renderForm('login');
    vi.spyOn(service, 'signInWithGoogle').mockRejectedValueOnce(new AuthError('unknown'));

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it('stays silent when the user closes the Google popup', async () => {
    const service = renderForm('login');
    vi.spyOn(service, 'signInWithGoogle').mockRejectedValueOnce(new AuthError('popup-closed'));

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy());
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
