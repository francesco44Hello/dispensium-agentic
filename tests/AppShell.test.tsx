// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => '/' }));

import { AuthProvider } from '../components/auth/AuthProvider';
import { AppShell } from '../components/AppShell';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

afterEach(() => {
  cleanup();
  replace.mockReset();
});

async function renderShell() {
  const auth = createAuthService(createMockAuthBackend());
  await auth.signUp('alice@example.com', 'secret123');
  render(
    <LocaleProvider>
      <AuthProvider service={auth}>
        <AppShell>
          <p>list body</p>
        </AppShell>
      </AuthProvider>
    </LocaleProvider>,
  );
  return auth;
}

describe('AppShell', () => {
  it('shows the app title, the page content and a menu link to the household page', async () => {
    await renderShell();
    expect(screen.getByRole('heading', { name: 'Dispensium' })).toBeInTheDocument();
    expect(screen.getByText('list body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });

  it('signs out from the side menu and redirects to login', async () => {
    const auth = await renderShell();
    const spy = vi.spyOn(auth, 'signOut');
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('marks the current tab and links every tab to its page', async () => {
    await renderShell();
    expect(screen.getByRole('link', { name: 'Shopping' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Recipes' }).getAttribute('href')).toBe('/recipes');
    expect(screen.getByRole('link', { name: 'Menu' }).getAttribute('href')).toBe('/weekly-menu');
    expect(screen.getByRole('link', { name: 'Household' }).getAttribute('href')).toBe('/household');
  });
});
