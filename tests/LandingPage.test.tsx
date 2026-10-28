// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LandingPage } from '../components/landing/LandingPage';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function renderLanding() {
  return render(
    <LocaleProvider>
      <LandingPage />
    </LocaleProvider>,
  );
}

describe('LandingPage', () => {
  it('leads with the headline and the brand tagline', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1, name: 'One list for the whole week.' })).toBeInTheDocument();
    expect(screen.getByText('Plan. Shop. Cook.')).toBeInTheDocument();
  });

  it('sends every sign-up and log-in entry point to the existing auth pages', () => {
    renderLanding();
    const signUp = screen.getAllByRole('link', { name: 'Create account' });
    const logIn = screen.getAllByRole('link', { name: 'Log in' });
    expect(signUp.length).toBeGreaterThanOrEqual(2);
    expect(logIn.length).toBeGreaterThanOrEqual(2);
    for (const link of signUp) expect(link).toHaveAttribute('href', '/signup');
    for (const link of logIn) expect(link).toHaveAttribute('href', '/login');
  });

  it('gives every screenshot an accessible name', () => {
    renderLanding();
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) expect(image).toHaveAccessibleName();
  });

  it('shows the page in Italian when Italian is the saved language', () => {
    window.localStorage.setItem('dispensium-locale', 'it');
    renderLanding();
    expect(screen.getByRole('heading', { level: 1, name: 'Una lista per tutta la settimana.' })).toBeInTheDocument();
  });

  it('does not embed a video until the recorded file exists', () => {
    const { container } = renderLanding();
    expect(container.querySelector('video')).toBeNull();
  });
});
