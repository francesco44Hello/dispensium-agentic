// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../hooks/useProfilePhoto', () => ({ useProfilePhoto: () => null }));
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ service: { signOut: vi.fn(async () => undefined) } }),
}));

import { AppHeader } from '../components/layout/AppHeader';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderHeader() {
  const { container } = render(
    <LocaleProvider>
      <AppHeader />
    </LocaleProvider>,
  );
  return container.querySelector('header') as HTMLElement;
}

describe('AppHeader on desktop', () => {
  it('shows the tagline under the title, in the header', () => {
    const header = renderHeader();
    expect(within(header).getByTestId('header-tagline')).toHaveTextContent('Plan. Shop. Cook.');
  });

  it('has a log out button in the header itself, not only in the menu', () => {
    const header = renderHeader();
    expect(within(header).getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});
