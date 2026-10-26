// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

import { AuthProvider } from '../components/auth/AuthProvider';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { AuthForm } from '../components/auth/AuthForm';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

afterEach(() => {
  cleanup();
  replace.mockReset();
});

const renderForm = (mode: 'login' | 'signup') => {
  const service = createAuthService(createMockAuthBackend());
  const signUp = vi.spyOn(service, 'signUp');
  render(
    <LocaleProvider>
      <AuthProvider service={service}>
        <AuthForm mode={mode} />
      </AuthProvider>
    </LocaleProvider>,
  );
  return { signUp };
};

describe('AuthForm name field', () => {
  it('asks for a name on the create account form', () => {
    renderForm('signup');
    expect(screen.getByLabelText(/^name$/i)).toBeTruthy();
  });

  it('does not ask for a name on the sign-in form', () => {
    renderForm('login');
    expect(screen.queryByLabelText(/^name$/i)).toBeNull();
  });

  it('sends the typed name with the sign-up', async () => {
    const { signUp } = renderForm('signup');

    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Ana Rossi' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/confirm/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account|sign up|registrati/i }));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('ana@example.com', 'secret123', 'Ana Rossi'));
  });
});
