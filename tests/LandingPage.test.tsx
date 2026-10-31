// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { LandingPage } from '../components/landing/LandingPage';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

  it('shows the shelf mark beside the wordmark in the top bar', () => {
    renderLanding();
    const mark = within(screen.getByRole('banner')).getByTestId('brand-mark');
    expect(mark).toHaveAttribute('src', '/brand/mark.svg');
    expect(mark.parentElement).toHaveTextContent('Dispensium');
  });

  it('shows the shelf logo beside the home screen title', () => {
    renderLanding();
    const title = screen.getByRole('heading', { level: 2, name: 'Keep it on your home screen' });
    expect(title.parentElement).toContainElement(within(title.parentElement as HTMLElement).getByTestId('brand-mark'));
  });

  it('explains how to add the app to the home screen on iPhone and on Android', () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 2, name: 'Keep it on your home screen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'iPhone and iPad' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Android' })).toBeInTheDocument();
    expect(screen.getByText('Tap the Share button.')).toBeInTheDocument();
    expect(screen.getByText('Choose Install app or Add to Home screen.')).toBeInTheDocument();
  });

  it('shows the steps for the visitor\'s own phone first, and the other phone behind a disclosure', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/130.0 Mobile Safari/537.36');
    const { container } = renderLanding();
    const disclosure = container.querySelector('details');
    expect(disclosure).toHaveTextContent('iPhone and iPad');
    expect(disclosure).not.toHaveTextContent('Choose Install app or Add to Home screen.');
    expect(screen.getByText('Choose Install app or Add to Home screen.')).toBeInTheDocument();
  });

  it('shows both phones side by side when the device is not a phone', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36');
    const { container } = renderLanding();
    expect(container.querySelector('details')).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'iPhone and iPad' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Android' })).toBeInTheDocument();
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

  it('plays the recorded walkthrough, with the still as its poster', () => {
    const { container } = renderLanding();
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('src', '/landing/demo.webm');
    expect(video).toHaveAttribute('poster', '/landing/demo-poster.png');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAccessibleName('Demo video of the app');
  });
});
