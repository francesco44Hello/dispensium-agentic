// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/recipes', useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../hooks/useProfilePhoto', () => ({ useProfilePhoto: () => null }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ service: { signOut: vi.fn(async () => undefined) } }) }));

import { AppShell } from '../components/AppShell';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('AppShell desktop full page', () => {
  it('marks the shell so desktop can drop the bottom bar and footer', () => {
    const { container } = render(
      <LocaleProvider>
        <AppShell hideHeader desktopFullPage>
          <p>detail</p>
        </AppShell>
      </LocaleProvider>,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(/desktopFullPage/);
  });
});
