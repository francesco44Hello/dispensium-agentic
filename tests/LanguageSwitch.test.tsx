// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { LanguageSwitch } from '../components/i18n/LanguageSwitch';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderSwitch() {
  return render(
    <LocaleProvider>
      <LanguageSwitch />
    </LocaleProvider>,
  );
}

describe('LanguageSwitch', () => {
  it('shows the flag of the current language and opens a small menu on click', () => {
    renderSwitch();
    const trigger = screen.getByRole('button', { name: 'Change language' });
    expect(trigger.querySelector('svg rect[fill="#012169"]')).not.toBeNull();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Italiano' })).toBeInTheDocument();
  });

  it('switches language from the menu, saves it and shows the new flag', () => {
    renderSwitch();
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Italiano' }));

    const trigger = screen.getByRole('button', { name: 'Cambia lingua' });
    expect(trigger.querySelector('svg rect[fill="#009246"]')).not.toBeNull();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('dispensium-locale')).toBe('it');
  });

  it('closes on Escape', () => {
    renderSwitch();
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Change language' }), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when you click outside the menu', () => {
    renderSwitch();
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
