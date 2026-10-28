// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../hooks/useProfilePhoto', () => ({ useProfilePhoto: () => 'https://lh3.googleusercontent.com/a/abc123' }));

import { BottomNav } from '../components/layout/BottomNav';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('BottomNav profile link', () => {
  it('links to the profile page from the navigation bar, on the far right', () => {
    render(
      <LocaleProvider>
        <BottomNav />
      </LocaleProvider>,
    );
    const links = screen.getAllByRole('link');
    expect(links[links.length - 1]).toHaveAttribute('href', '/profile');
    expect(links[links.length - 1]).toHaveAccessibleName('Profile');
  });

  it('shows the user’s profile picture, not a generic icon', () => {
    render(
      <LocaleProvider>
        <BottomNav />
      </LocaleProvider>,
    );
    const profile = screen.getByRole('link', { name: 'Profile' });
    expect(profile.querySelector('img')).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/abc123');
  });
});
