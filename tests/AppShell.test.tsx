// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }), usePathname: () => '/' }));

import { AuthProvider } from '../components/auth/AuthProvider';
import { AppShell } from '../components/AppShell';
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
    <AuthProvider service={auth}>
      <AppShell>
        <p>list body</p>
      </AppShell>
    </AuthProvider>,
  );
  return auth;
}

describe('AppShell', () => {
  it('shows the app title, the page content and a menu link to the household page', async () => {
    await renderShell();
    expect(screen.getByRole('heading', { name: 'Dispensium' })).toBeTruthy();
    expect(screen.getByText('list body')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open household menu' }).getAttribute('href')).toBe('/household');
  });

  it('signs out from the header icon and redirects to login', async () => {
    const auth = await renderShell();
    const spy = vi.spyOn(auth, 'signOut');
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('marks Shopping as the current tab and shows the other tabs as unavailable', async () => {
    await renderShell();
    expect(screen.getByRole('link', { name: 'Shopping' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByText('Recipes').closest('[aria-disabled="true"]')).toBeTruthy();
    expect(screen.getByText('Menu', { selector: 'span' }).closest('[aria-disabled="true"]')).toBeTruthy();
    expect(screen.getByText('Manage').closest('[aria-disabled="true"]')).toBeTruthy();
  });
});
