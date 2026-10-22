// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LocaleProvider } from '../components/i18n/LocaleProvider';
import { LanguageSelect } from '../components/i18n/LanguageSelect';

function renderSelect() {
  return render(
    <LocaleProvider>
      <LanguageSelect />
    </LocaleProvider>,
  );
}

describe('LanguageSelect', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('offers English and Italian under a Language label', () => {
    renderSelect();
    const select = screen.getByRole('combobox', { name: 'Language' });
    expect(select).toHaveValue('en');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Italiano' })).toBeInTheDocument();
  });

  it('switches the app language when a different language is picked', async () => {
    renderSelect();
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'it' } });
    expect(await screen.findByRole('combobox', { name: 'Lingua' })).toHaveValue('it');
    expect(window.localStorage.getItem('dispensium-locale')).toBe('it');
  });
});
