// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { AppIcon } from '../components/icons/AppIcon';

afterEach(cleanup);

describe('AppIcon', () => {
  it('draws the named icon from the shared sprite', () => {
    const { container } = render(<AppIcon name="cat-fish" />);
    expect(container.querySelector('use')).toHaveAttribute('href', '/icons/sprite.svg#cat-fish');
  });

  it('is decorative, so screen readers skip it', () => {
    const { container } = render(<AppIcon name="meal-lunch" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
