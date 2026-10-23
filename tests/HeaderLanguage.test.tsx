// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace: vi.fn() }) }));

import { AppHeader } from '../components/layout/AppHeader';
import { AuthProvider } from '../components/auth/AuthProvider';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { createAuthService } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

function renderHeader() {
  const service = createAuthService(createMockAuthBackend());
  render(
    <LocaleProvider>
      <AuthProvider service={service}>
        <AppHeader />
      </AuthProvider>
    </LocaleProvider>,
  );
}

describe('AppHeader language menu', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('keeps logout out of the header: it lives in the side menu now', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });

  it('shows the current language as a flag and opens a list of the other languages', async () => {
    renderHeader();
    const toggle = await screen.findByRole('button', { name: 'Change language' });
    expect(toggle).toHaveTextContent('🇬🇧');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    const list = screen.getByRole('listbox', { name: 'Change language' });
    expect(within(list).getByRole('option', { name: /Italiano/ })).toHaveTextContent('🇮🇹');
    expect(within(list).queryByRole('option', { name: /English/ })).toBeNull();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('changes the language from the list and shows the new flag', async () => {
    renderHeader();
    fireEvent.click(await screen.findByRole('button', { name: 'Change language' }));
    fireEvent.click(screen.getByRole('option', { name: /Italiano/ }));

    expect(window.localStorage.getItem('dispensium-locale')).toBe('it');
    const toggle = await screen.findByRole('button', { name: 'Cambia lingua' });
    expect(toggle).toHaveTextContent('🇮🇹');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Apri menu' })).toBeTruthy();
  });
});
