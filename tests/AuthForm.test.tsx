// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

import { AuthProvider } from '../components/auth/AuthProvider';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
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

describe('AuthForm in Italian', () => {
  afterEach(() => window.localStorage.clear());

  it('shows the form text and errors in Italian when Italian is the chosen language', async () => {
    window.localStorage.setItem('dispensium-locale', 'it');
    const service = createAuthService(createMockAuthBackend());
    render(
      <LocaleProvider>
        <AuthProvider service={service}>
          <AuthForm mode="login" />
        </AuthProvider>
      </LocaleProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continua con Google' })).toBeTruthy();
    expect(screen.getByText('Sei nuovo qui?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Accedi' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Inserisci un indirizzo email valido.');
  });
});

describe('AuthForm submit button colour', () => {
  const css = readFileSync(join(process.cwd(), 'components/auth/AuthForm.module.css'), 'utf8');
  const ruleFor = (selector: string) => new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('gives the login submit button the default green background', () => {
    renderForm('login');
    const loginButton = screen.getByRole('button', { name: 'Log in' });
    expect(loginButton.className).not.toMatch(/loginSubmit/);
    expect(ruleFor('submit')).toMatch(/background:\s*var\(--primary-button\);/);
  });

  it('has no blue override for the login submit button in the stylesheet', () => {
    expect(css).not.toMatch(/\.loginSubmit/);
  });

  it('keeps the signup submit button on the default colours', () => {
    renderForm('signup');
    const signupButton = screen.getByRole('button', { name: 'Sign up' });
    expect(signupButton.className).not.toMatch(/loginSubmit/);
  });
});

describe('AuthForm language selector', () => {
  it('lets a signed-out person choose the language on the login and signup pages', () => {
    renderForm('login');
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeTruthy();
    cleanup();
    renderForm('signup');
    expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeTruthy();
  });
});

describe('AuthForm sticker card', () => {
  const css = readFileSync(join(process.cwd(), 'components/auth/AuthForm.module.css'), 'utf8');
  const ruleFor = (selector: string) => new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('shows the Plan. Shop. Cook. sticker above the form', () => {
    renderForm('login');
    expect(screen.getByText('Plan. Shop. Cook.')).toBeTruthy();
  });

  it('shows the Italian sticker when Italian is the chosen language', () => {
    window.localStorage.setItem('dispensium-locale', 'it');
    const service = createAuthService(createMockAuthBackend());
    render(
      <LocaleProvider>
        <AuthProvider service={service}>
          <AuthForm mode="login" />
        </AuthProvider>
      </LocaleProvider>,
    );
    expect(screen.getByText('Pianifica. Compra. Cucina.')).toBeTruthy();
    window.localStorage.removeItem('dispensium-locale');
  });

  it('gives the card the tinted surface, not plain white', () => {
    expect(ruleFor('form')).toMatch(/background:\s*var\(--surface-tint\);/);
  });
});
