// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AuthContext } from '../components/auth/AuthProvider';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { ProfileScreen } from '../components/profile/ProfileScreen';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';
import type { AuthUser } from '../services/authService';

const GOOGLE_PHOTO = 'https://lh3.googleusercontent.com/a/abc123';

function renderProfile(user: AuthUser) {
  const service = createAuthService(createMockAuthBackend());
  return render(
    <LocaleProvider>
      <AuthContext.Provider value={{ status: 'authenticated', user, service }}>
        <ProfileScreen />
      </AuthContext.Provider>
    </LocaleProvider>,
  );
}

const alice: AuthUser = { uid: 'alice', email: 'alice@example.com', displayName: 'Alice', photoURL: GOOGLE_PHOTO };

describe('ProfileScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('shows the heading, name, email and a link back to the list', () => {
    const { container } = renderProfile(alice);
    expect(screen.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Back to list' })).toHaveAttribute('href', '/');
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('shows the Google profile picture when the account has one', () => {
    const { container } = renderProfile(alice);
    expect(container.querySelector('img')).toHaveAttribute('src', GOOGLE_PHOTO);
  });

  it('shows the placeholder when there is no picture, or the picture is not from Google', () => {
    const { container, unmount } = renderProfile({ ...alice, photoURL: null });
    expect(container.querySelector('img')).toBeNull();
    unmount();

    const { container: other } = renderProfile({ ...alice, photoURL: 'https://evil.example/face.png' });
    expect(other.querySelector('img')).toBeNull();
  });

  it('shows a fallback label when the account has no name', () => {
    renderProfile({ ...alice, displayName: null });
    expect(screen.getByText('No name yet')).toBeInTheDocument();
  });

  it('lets the user pick the app language from the profile', async () => {
    renderProfile(alice);
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    fireEvent.change(select, { target: { value: 'it' } });

    expect(window.localStorage.getItem('dispensium-locale')).toBe('it');
    expect(await screen.findByRole('heading', { level: 1, name: 'Profilo' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Lingua' })).toHaveValue('it');
  });
});
