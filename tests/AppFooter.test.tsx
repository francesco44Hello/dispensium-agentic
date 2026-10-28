// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AppFooter } from '../components/layout/AppFooter';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('AppFooter', () => {
  it('shows the author, the year and the rights line from the mobile menu', () => {
    render(
      <LocaleProvider>
        <AppFooter />
      </LocaleProvider>,
    );
    expect(screen.getByText('© Francesco Longo')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('All rights Reserved')).toBeInTheDocument();
  });
});
