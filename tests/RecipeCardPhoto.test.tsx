// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const { photoUrl } = vi.hoisted(() => ({ photoUrl: vi.fn(async (path: string) => `blob:${path}`) }));
vi.mock('../services/dataClient', () => ({ recipeService: { photoUrl } }));
vi.mock('../components/i18n/LocaleProvider', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

import { RecipeCard } from '../components/recipes/RecipeCard';
import type { Recipe } from '../types/recipe';

const recipe = (image: string): Recipe =>
  ({ id: 'r1', title: 'Pasta', time: '20', category: 'Dinner', label: '', image }) as Recipe;

afterEach(() => {
  cleanup();
  photoUrl.mockClear();
});

describe('RecipeCard photo', () => {
  it('shows a skeleton, not an image, while the photo is still loading', () => {
    photoUrl.mockReturnValueOnce(new Promise<string>(() => {}));
    const { container } = render(<RecipeCard recipe={recipe('households/h/recipes/a.webp')} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-testid="photo-skeleton"]')).not.toBeNull();
  });

  it('shows the photo once it has loaded', async () => {
    const { container } = render(<RecipeCard recipe={recipe('households/h/recipes/b.webp')} />);

    await waitFor(() => expect(container.querySelector('img')).toHaveAttribute('src', 'blob:households/h/recipes/b.webp'));
    expect(container.querySelector('[data-testid="photo-skeleton"]')).toBeNull();
  });

  it('keeps the bundled picture for a recipe without a photo', () => {
    const { container } = render(<RecipeCard recipe={recipe('')} />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/fruit-login.jpg');
    expect(photoUrl).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Pasta' })).toBeInTheDocument();
  });
});
