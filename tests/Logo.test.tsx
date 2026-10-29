// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Logo } from '../components/brand/Logo';

afterEach(cleanup);

describe('Logo', () => {
  it('draws the shelf mark from the one shared SVG file', () => {
    const { getByTestId } = render(<Logo />);
    expect(getByTestId('brand-mark')).toHaveAttribute('src', '/brand/mark.svg');
  });

  it('is decorative, because the wordmark beside it already names the app', () => {
    const { getByTestId } = render(<Logo />);
    expect(getByTestId('brand-mark')).toHaveAttribute('alt', '');
  });

  it('uses the size it is given and the class it is given', () => {
    const { getByTestId } = render(<Logo size={48} className="mark" />);
    const mark = getByTestId('brand-mark');
    expect(mark).toHaveAttribute('width', '48');
    expect(mark).toHaveAttribute('height', '48');
    expect(mark).toHaveClass('mark');
  });
});
