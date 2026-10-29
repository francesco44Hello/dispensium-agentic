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

  it('offers English and Italian as radio buttons in a Language group', () => {
    renderSelect();
    const group = screen.getByRole('radiogroup', { name: 'Language' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Italiano' })).not.toBeChecked();
  });

  it('draws each flag as a round picture that screen readers skip', () => {
    const { container } = renderSelect();
    const flags = container.querySelectorAll('svg');
    expect(flags).toHaveLength(2);
    for (const flag of flags) expect(flag).toHaveAttribute('aria-hidden', 'true');
  });

  it('switches the app language when a different flag is chosen', async () => {
    renderSelect();
    fireEvent.click(screen.getByRole('radio', { name: 'Italiano' }));
    expect(await screen.findByRole('radiogroup', { name: 'Lingua' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Italiano' })).toBeChecked();
    expect(window.localStorage.getItem('dispensium-locale')).toBe('it');
  });
});
