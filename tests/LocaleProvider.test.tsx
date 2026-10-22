// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, beforeEach } from 'vitest';
import { LocaleProvider, useLocale } from '../components/i18n/LocaleProvider';

function Probe() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div>
      <p>{`locale:${locale}`}</p>
      <p>{t('language.label')}</p>
      <button onClick={() => setLocale('it')}>choose-it</button>
    </div>
  );
}

describe('LocaleProvider', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = 'en';
  });

  it('starts in English when nothing is saved and the browser is not Italian', async () => {
    render(<LocaleProvider><Probe /></LocaleProvider>);
    await screen.findByText('locale:en');
    screen.getByText('Language');
  });

  it('switches language, saves the choice and updates the page language', async () => {
    render(<LocaleProvider><Probe /></LocaleProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'choose-it' }));
    screen.getByText('locale:it');
    screen.getByText('Lingua');
    expect(window.localStorage.getItem('dispensium-locale')).toBe('it');
    await waitFor(() => expect(document.documentElement.lang).toBe('it'));
  });

  it('restores the saved choice on the next visit', async () => {
    window.localStorage.setItem('dispensium-locale', 'it');
    render(<LocaleProvider><Probe /></LocaleProvider>);
    await screen.findByText('locale:it');
  });

  it('ignores a saved value that is not supported', async () => {
    window.localStorage.setItem('dispensium-locale', 'de');
    render(<LocaleProvider><Probe /></LocaleProvider>);
    await screen.findByText('locale:en');
  });

  it('throws a clear error when useLocale is used outside the provider', () => {
    const original = console.error;
    console.error = () => undefined;
    try {
      expect(() => render(<Probe />)).toThrow(/LocaleProvider/);
    } finally {
      console.error = original;
    }
  });
});
