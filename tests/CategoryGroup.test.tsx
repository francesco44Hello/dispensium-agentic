// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import { CategoryGroup } from '../components/groceries/CategoryGroup';
import { LocaleProvider } from '../components/i18n/LocaleProvider';

afterEach(cleanup);

function renderGroup(category: string) {
  return render(
    <LocaleProvider>
      <CategoryGroup category={category} items={[]} onToggle={vi.fn()} />
    </LocaleProvider>,
  );
}

describe('CategoryGroup heading icon', () => {
  it.each([
    ['fruits', 'cat-fruits'],
    ['vegetables', 'cat-vegetables'],
    ['dairy', 'cat-dairy'],
    ['meat', 'cat-meat'],
    ['fish', 'cat-fish'],
    ['bakery', 'cat-bakery'],
    ['pantry', 'cat-pantry-shelf'],
    ['snacks', 'cat-snacks'],
    ['drinks', 'cat-drinks'],
    ['household', 'cat-household'],
  ])('shows the %s icon in its heading', (category, icon) => {
    const { container } = renderGroup(category);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(container.querySelector('h2 use')).toHaveAttribute('href', `/icons/sprite.svg#${icon}`);
  });

  it('shows no icon for other, because the set has none for it', () => {
    const { container } = renderGroup('other');
    expect(container.querySelector('h2 use')).toBeNull();
  });
});
