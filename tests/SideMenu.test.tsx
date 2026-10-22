// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { SideMenu } from '../components/layout/SideMenu';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(cleanup);

describe('SideMenu', () => {
  it('shows the app name, its tagline and the Explore links, as in the legacy menu', () => {
    render(<LocaleProvider><SideMenu open onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.getByText('Dispensium')).toBeInTheDocument();
    expect(screen.getByText('Plan. Shop. Cook.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Explore' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Shopping List/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Recipes/ })).toHaveAttribute('href', '/recipes');
    expect(screen.getByRole('link', { name: /Weekly Menu/ })).toHaveAttribute('href', '/weekly-menu');
    expect(screen.getByRole('link', { name: /Household/ })).toHaveAttribute('href', '/household');
    expect(screen.queryByRole('link', { name: /Manage Categories/ })).toBeNull();
  });

  it('shows the app name as text, not as a heading, so the page keeps one h1', () => {
    render(<LocaleProvider><SideMenu open={false} onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.queryByRole('heading', { name: 'Dispensium', hidden: true })).toBeNull();
    expect(screen.getByText('Dispensium')).toBeInTheDocument();
  });

  it('offers the language selector in the footer', () => {
    render(<LocaleProvider><SideMenu open onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
  });

  it('shows the copyright footer', () => {
    render(<LocaleProvider><SideMenu open onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.getByText('© Francesco Longo')).toBeInTheDocument();
    expect(screen.getByText('All rights Reserved')).toBeInTheDocument();
  });

  it('reports whether it is open', () => {
    const { rerender } = render(<LocaleProvider><SideMenu open={false} onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.getByRole('complementary', { hidden: true })).toHaveAttribute('data-open', 'false');
    rerender(<LocaleProvider><SideMenu open onClose={vi.fn()} /></LocaleProvider>);
    expect(screen.getByRole('complementary')).toHaveAttribute('data-open', 'true');
  });

  it('closes from the close button and when a link is chosen', () => {
    const onClose = vi.fn();
    render(<LocaleProvider><SideMenu open onClose={onClose} /></LocaleProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    fireEvent.click(screen.getByRole('link', { name: /Recipes/ }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
