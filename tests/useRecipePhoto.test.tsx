// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

const { photoUrl } = vi.hoisted(() => ({ photoUrl: vi.fn(async (path: string) => `blob:${path}`) }));
vi.mock('../services/dataClient', () => ({ recipeService: { photoUrl } }));

import { useRecipePhoto } from '../hooks/useRecipePhoto';

function Photo({ path }: { path: string }) {
  const url = useRecipePhoto(path);
  return <span data-testid={path}>{url}</span>;
}

afterEach(() => {
  cleanup();
  photoUrl.mockClear();
});

describe('useRecipePhoto', () => {
  it('fetches each photo once, however many components show it', async () => {
    render(
      <>
        <Photo path="households/h/recipes/shared.webp" />
        <Photo path="households/h/recipes/shared.webp" />
      </>,
    );
    await waitFor(() => expect(screen.getAllByTestId('households/h/recipes/shared.webp')[0]).toHaveTextContent('blob:'));
    expect(photoUrl).toHaveBeenCalledTimes(1);
  });

  it('shows nothing and does not fetch when there is no photo', () => {
    render(<Photo path="" />);
    expect(photoUrl).not.toHaveBeenCalled();
  });

  it('shows an already loaded photo on the first render, so moving between cards does not flash the placeholder', async () => {
    const path = 'households/h/recipes/remounted.webp';
    const first = render(<Photo path={path} />);
    await waitFor(() => expect(screen.getByTestId(path)).toHaveTextContent('blob:'));
    first.unmount();

    render(<Photo path={path} />);
    expect(screen.getByTestId(path)).toHaveTextContent(`blob:${path}`);
  });
});
