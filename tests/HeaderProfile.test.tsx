// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace: vi.fn() }) }));

import { AppHeader } from '../components/layout/AppHeader';
import { AuthContext } from '../components/auth/AuthProvider';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';
import type { AuthUser } from '../services/authService';

const GOOGLE_PHOTO = 'https://lh3.googleusercontent.com/a/abc123';

function renderHeader(user: AuthUser | null) {
  const service = createAuthService(createMockAuthBackend());
  return render(
    <LocaleProvider>
      <AuthContext.Provider value={{ status: user ? 'authenticated' : 'unauthenticated', user, service }}>
        <AppHeader />
      </AuthContext.Provider>
    </LocaleProvider>,
  );
}

const alice: AuthUser = { uid: 'alice', email: 'alice@example.com', displayName: 'Alice', photoURL: GOOGLE_PHOTO };

describe('AppHeader profile link', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('links the profile picture to the profile page', () => {
    renderHeader(alice);
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });

  it('shows the Google profile picture in the header', () => {
    const { container } = renderHeader(alice);
    expect(screen.getByRole('link', { name: 'Profile' }).querySelector('img')).toHaveAttribute('src', GOOGLE_PHOTO);
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });

  it('shows the placeholder in the header when the user has no picture', () => {
    renderHeader({ ...alice, photoURL: null });
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link.querySelector('img')).toBeNull();
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('no longer shows the language flag or the language list in the header', () => {
    renderHeader(alice);
    expect(screen.queryByRole('button', { name: 'Change language' })).toBeNull();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps logout out of the header: it lives in the side menu', () => {
    renderHeader(alice);
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });
});
