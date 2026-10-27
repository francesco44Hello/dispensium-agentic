// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../components/auth/AuthProvider';
import { HouseholdContext } from '../components/household/HouseholdProvider';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { ProfileScreen } from '../components/profile/ProfileScreen';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';
import type { AuthUser } from '../services/authService';
import { createHouseholdStub } from './householdStub';

const GOOGLE_PHOTO = 'https://lh3.googleusercontent.com/a/abc123';

const alice: AuthUser = { uid: 'alice', email: 'alice@example.com', displayName: 'Alice', photoURL: GOOGLE_PHOTO };

function renderProfile(user: AuthUser, household = createHouseholdStub()) {
  const authService = createAuthService(createMockAuthBackend());
  const updateDisplayName = async (name: string) => ({ ...user, displayName: name });
  const service = { ...authService, updateDisplayName };
  const rendered = render(
    <LocaleProvider>
      <AuthContext.Provider value={{ status: 'authenticated', user, service }}>
        <HouseholdContext.Provider value={{ status: 'ready', householdId: 'hh-1', error: null, service: household.service }}>
          <ProfileScreen />
        </HouseholdContext.Provider>
      </AuthContext.Provider>
    </LocaleProvider>,
  );
  return { ...rendered, household };
}

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
    // The large profile picture is a direct child of its section; the avatar picker has images inside buttons.
    const { container, unmount } = renderProfile({ ...alice, photoURL: null });
    expect(container.querySelector('section > img')).toBeNull();
    unmount();

    const { container: other } = renderProfile({ ...alice, photoURL: 'https://evil.example/face.png' });
    expect(other.querySelector('section > img')).toBeNull();
  });

  it('shows a fallback label when the account has no name', () => {
    renderProfile({ ...alice, displayName: null });
    expect(screen.getByText('No name yet')).toBeInTheDocument();
  });

  it('keeps the email read-only', () => {
    renderProfile(alice);
    expect(screen.queryByRole('textbox', { name: 'Email' })).toBeNull();
  });

  it('saves a new name to the account and to the household', async () => {
    const { household } = renderProfile(alice);
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    await waitFor(() => expect(household.saveMemberName).toHaveBeenCalledWith('hh-1', 'alice', 'Bob'));
  });

  it('lets the user pick a built-in avatar and saves it to the household', async () => {
    const { container, household } = renderProfile(alice);
    fireEvent.click(screen.getByRole('button', { name: 'Avatar 2' }));

    await waitFor(() => expect(household.saveMemberPhoto).toHaveBeenCalledWith('hh-1', 'alice', '/avatars/avatar-2.svg'));
    expect(container.querySelector('img')).toHaveAttribute('src', '/avatars/avatar-2.svg');
  });

  it('offers the Google picture again after a built-in avatar was picked', async () => {
    const { household } = renderProfile(alice);
    fireEvent.click(screen.getByRole('button', { name: 'Avatar 1' }));
    await waitFor(() => expect(household.saveMemberPhoto).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Use my Google picture' }));
    await waitFor(() => expect(household.saveMemberPhoto).toHaveBeenLastCalledWith('hh-1', 'alice', GOOGLE_PHOTO));
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
