// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/recipes' } }));
const { compressed } = vi.hoisted(() => ({ compressed: new Blob(['compressed'], { type: 'image/webp' }) }));
vi.mock('../utils/compressImage', () => ({ compressImage: vi.fn(async () => compressed) }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current, useRouter: () => ({ replace: vi.fn() }) }));

import { RecipeForm } from '../components/recipes/RecipeForm';
import { ImportPanel } from '../components/recipes/ImportPanel';
import { RecipeSheet } from '../components/recipes/RecipeSheet';
import { RecipeList } from '../components/recipes/RecipeList';
import { BottomNav } from '../components/layout/BottomNav';
import type { Recipe } from '../types/recipe';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('RecipeForm', () => {
  it('sends the form values, including empty ingredient and step rows', async () => {
    const onSubmit = vi.fn();
    render(<RecipeForm onSubmit={onSubmit} photo={null} onPhotoChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Recipe title'), { target: { value: 'Soup' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '30 min' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Lunch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cozy Winter ❄️' }));
    fireEvent.change(screen.getByLabelText('Ingredient 1'), { target: { value: 'water' } });
    fireEvent.change(screen.getByLabelText('Step 1'), { target: { value: 'Boil' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Soup',
      time: '30 min',
      category: 'Lunch',
      label: 'Cozy Winter ❄️',
      ingredients: ['water', '', '', ''],
      steps: ['Boil', '', ''],
      image: '',
    });
  });

  it('requires a title', () => {
    render(<RecipeForm onSubmit={vi.fn()} photo={null} onPhotoChange={vi.fn()} />);
    expect(screen.getByLabelText('Recipe title')).toBeRequired();
  });

  it('adds ingredient and step rows on request', () => {
    render(<RecipeForm onSubmit={vi.fn()} photo={null} onPhotoChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add ingredient' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add step' }));
    expect(screen.getByLabelText('Ingredient 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Step 4')).toBeInTheDocument();
  });

  it('shows imported values and the cover photo preview', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    render(
      <RecipeForm
        onSubmit={vi.fn()}
        photo={new Blob(['x'], { type: 'image/webp' })}
        onPhotoChange={vi.fn()}
        initial={{ title: 'Imported', ingredients: ['rice'], steps: ['Cook'] }}
      />,
    );
    expect(screen.getByLabelText('Recipe title')).toHaveValue('Imported');
    expect(screen.getByLabelText('Ingredient 1')).toHaveValue('rice');
    expect(screen.getByAltText('Recipe cover')).toHaveAttribute('src', 'blob:preview');
  });

  it('compresses a chosen photo and hands the result up', async () => {
    const onPhotoChange = vi.fn();
    render(<RecipeForm onSubmit={vi.fn()} photo={null} onPhotoChange={onPhotoChange} />);
    const file = new File(['raw'], 'holiday.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Recipe photo'), { target: { files: [file] } });
    await waitFor(() => expect(onPhotoChange).toHaveBeenCalledTimes(1));
    expect(onPhotoChange).toHaveBeenCalledWith(compressed);
  });

  it('sends the chosen photo along with the recipe', async () => {
    const onSubmit = vi.fn();
    const photo = new Blob(['x'], { type: 'image/webp' });
    render(<RecipeForm onSubmit={onSubmit} photo={photo} onPhotoChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Recipe title'), { target: { value: 'Soup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save recipe' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][1]).toBe(photo);
  });

  it('no longer asks for a cover image link', () => {
    render(<RecipeForm onSubmit={vi.fn()} photo={null} onPhotoChange={vi.fn()} />);
    expect(screen.queryByLabelText('Cover image link')).toBeNull();
  });
});

describe('ImportPanel', () => {
  it('posts the URL to the import route and passes the recipe up', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ title: 'Soup', ingredients: ['water'], steps: ['Boil'], image: '' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const onImported = vi.fn();
    render(<ImportPanel onImported={onImported} />);

    fireEvent.change(screen.getByLabelText('Recipe link'), { target: { value: 'https://example.com/soup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(onImported).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/scrape-recipe', expect.objectContaining({ method: 'POST' }));
    expect(onImported.mock.calls[0][0]).toMatchObject({ title: 'Soup' });
  });

  it('shows the error from the server when the import fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'Could not find a recipe on this page.' }), { status: 404 })));
    const onImported = vi.fn();
    render(<ImportPanel onImported={onImported} />);

    fireEvent.change(screen.getByLabelText('Recipe link'), { target: { value: 'https://example.com/none' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not find a recipe on this page.');
    expect(onImported).not.toHaveBeenCalled();
  });

  it('does not pass on a 200 response that is not a recipe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ title: 42 }), { status: 200 })));
    const onImported = vi.fn();
    render(<ImportPanel onImported={onImported} />);

    fireEvent.change(screen.getByLabelText('Recipe link'), { target: { value: 'https://example.com/odd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onImported).not.toHaveBeenCalled();
  });
});

describe('RecipeSheet', () => {
  it('is a modal dialog that is open only when told to be', () => {
    const { rerender } = render(<RecipeSheet open={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('data-open', 'false');

    rerender(<RecipeSheet open onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-open', 'true');
    expect(screen.getByRole('heading', { name: 'New recipe' })).toBeInTheDocument();
  });

  it('starts empty every time it is opened', () => {
    const { rerender } = render(<RecipeSheet open onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Recipe title'), { target: { value: 'Half done' } });
    rerender(<RecipeSheet open={false} onClose={vi.fn()} onSave={vi.fn()} />);
    rerender(<RecipeSheet open onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Recipe title')).toHaveValue('');
  });

  it('closes from its close button', () => {
    const onClose = vi.fn();
    render(<RecipeSheet open onClose={onClose} onSave={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('RecipeList', () => {
  const recipe: Recipe = {
    id: 'r1',
    title: 'Carbonara',
    time: '25 min',
    category: 'Dinner',
    label: 'Quick & Easy ⚡',
    ingredients: ['spaghetti'],
    steps: ['Boil'],
    image: '',
    createdAt: new Date(0),
    createdBy: 'alice',
  };

  it('lists recipes by title with their time and category', () => {
    render(<RecipeList recipes={[recipe]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent('Carbonara');
    expect(screen.getByRole('listitem')).toHaveTextContent('25 min');
    expect(screen.getByRole('listitem')).toHaveTextContent('Dinner');
  });

  it('links each recipe to its own page', () => {
    render(<RecipeList recipes={[recipe]} />);
    expect(screen.getByRole('link', { name: /Carbonara/ })).toHaveAttribute('href', '/recipes/r1');
  });

  it('shows the legacy placeholder photo when a recipe has none', () => {
    render(<RecipeList recipes={[recipe]} />);
    expect(screen.getByAltText('Carbonara')).toHaveAttribute('src', '/fruit-login.jpg');
  });

  it('shows the label bar on the card', () => {
    render(<RecipeList recipes={[recipe]} />);
    expect(screen.getByText('Quick & Easy ⚡')).toBeInTheDocument();
  });

  it('shows an empty state when there are no recipes', () => {
    render(<RecipeList recipes={[]} />);
    expect(screen.getByText(/No recipes yet/)).toBeInTheDocument();
  });
});

describe('BottomNav add button', () => {
  beforeEach(() => {
    pathname.current = '/recipes';
  });

  it('shows the add button on the recipes page and calls onAdd', () => {
    const onAdd = vi.fn();
    render(<BottomNav onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add recipe' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('does not show the add button on other pages', () => {
    pathname.current = '/';
    render(<BottomNav onAdd={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Add recipe' })).toBeNull();
  });
});

describe('RecipeSheet photo import', () => {
  it('ignores a photo that arrives after a newer import has replaced the first one', async () => {
    let finishFirst: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { url: string };
      if (body.url === 'https://example.com/first.png') {
        return new Promise<Response>((resolve) => { finishFirst = resolve; });
      }
      return Promise.resolve(new Response(new Blob(['second'], { type: 'image/webp' }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const importOnce = async (url: string, title: string) => {
      const jsonBody = JSON.stringify({ title, ingredients: [], steps: [], image: url });
      vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
        if (String(input) === '/api/scrape-recipe') return new Response(jsonBody, { status: 200 });
        return fetchMock(input, init);
      }));
      fireEvent.change(screen.getByLabelText('Recipe link'), { target: { value: `https://example.com/${title}` } });
      fireEvent.click(screen.getByRole('button', { name: 'Import' }));
      await waitFor(() => expect(screen.getByLabelText('Recipe title')).toHaveValue(title));
    };

    const previews = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:second');
    render(<RecipeSheet open onClose={vi.fn()} onSave={vi.fn()} />);
    await importOnce('https://example.com/first.png', 'First');
    await importOnce('https://example.com/second.png', 'Second');
    finishFirst(new Response(new Blob(['first'], { type: 'image/webp' }), { status: 200 }));
    await new Promise((done) => setTimeout(done, 0));
    // Only the second import's photo was ever previewed, so the late first photo was ignored.
    expect(previews).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText('Recipe cover')).toHaveAttribute('src', 'blob:second');
  });

  it('keeps the text usable when the photo copy fails', async () => {
    const jsonBody = JSON.stringify({ title: 'Soup', ingredients: ['water'], steps: ['Boil'], image: 'https://example.com/x.png' });
    vi.stubGlobal('fetch', vi.fn(async (input: string) =>
      String(input) === '/api/scrape-recipe'
        ? new Response(jsonBody, { status: 200 })
        : new Response('nope', { status: 415 }),
    ));
    render(<RecipeSheet open onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Recipe link'), { target: { value: 'https://example.com/soup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(screen.getByLabelText('Recipe title')).toHaveValue('Soup'));
    expect(screen.queryByRole('alert')).toBe(null);
    expect(screen.getByLabelText('Recipe title')).toBeEnabled();
  });
});

