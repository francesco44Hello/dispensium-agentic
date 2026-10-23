// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace: vi.fn() }) }));

import { BottomNav } from '../components/layout/BottomNav';
import { SideMenu } from '../components/layout/SideMenu';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

describe('layout in Italian', () => {
  beforeEach(() => {
    window.localStorage.setItem('dispensium-locale', 'it');
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('translates the bottom navigation tabs', async () => {
    render(
      <LocaleProvider>
        <BottomNav />
      </LocaleProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Spesa' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ricette' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Famiglia' })).toBeTruthy();
  });

  it('translates the side menu headings and links', async () => {
    render(
      <LocaleProvider>
        <SideMenu open onClose={vi.fn()} />
      </LocaleProvider>,
    );
    expect(await screen.findByRole('heading', { level: 2, name: 'Esplora' })).toBeTruthy();
    expect(screen.getByText('Pianifica. Compra. Cucina.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Lista della spesa/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Menu settimanale/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Chiudi menu' })).toBeTruthy();
  });
});
