// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';

vi.mock('../hooks/useRecipePhoto', () => ({ useRecipePhoto: () => '' }));

import { CalendarBar } from '../components/menu/CalendarBar';
import { MealTabs } from '../components/menu/MealTabs';
import { MealDisplay } from '../components/menu/MealDisplay';
import { MealEditForm } from '../components/menu/MealEditForm';
import { MenuListView } from '../components/menu/MenuListView';
import type { Recipe } from '../types/recipe';
import type { DayMenu, MealEntry } from '../types/menu';

afterEach(cleanup);

const EMPTY: MealEntry = { main: '', side: '', mainRecipeId: '', sideRecipeId: '' };
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

describe('CalendarBar', () => {
  const days = ['2026-10-15', '2026-10-16', '2026-10-17'];

  it('shows each day with its weekday and number, and marks the selected one', () => {
    render(<CalendarBar days={days} selected="2026-10-16" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Fri 16/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Thu 15/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the tapped day', () => {
    const onSelect = vi.fn();
    render(<CalendarBar days={days} selected="2026-10-16" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /Sat 17/ }));
    expect(onSelect).toHaveBeenCalledWith('2026-10-17');
  });
});

describe('CalendarBar earlier days', () => {
  it('offers an arrow that loads earlier days', () => {
    const onPrevious = vi.fn();
    render(<CalendarBar days={['2026-10-22']} selected="2026-10-22" onSelect={vi.fn()} previous="load" onPrevious={onPrevious} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load previous days' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('offers to hide the earlier days once two weeks are loaded', () => {
    const onPrevious = vi.fn();
    render(<CalendarBar days={['2026-10-22']} selected="2026-10-22" onSelect={vi.fn()} previous="hide" onPrevious={onPrevious} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide previous days' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });
});

describe('MealTabs', () => {
  it('switches between lunch and dinner', () => {
    const onSelect = vi.fn();
    render(<MealTabs selected="lunch" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Lunch' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Dinner' }));
    expect(onSelect).toHaveBeenCalledWith('dinner');
  });
});

describe('MealDisplay', () => {
  it('links a meal to its recipe when the entry has one', () => {
    render(<MealDisplay meal="lunch" entry={{ ...EMPTY, main: 'Carbonara', mainRecipeId: 'r1' }} recipes={[recipe]} onEdit={vi.fn()} />);
    expect(screen.getByRole('link', { name: /Carbonara/ })).toHaveAttribute('href', '/recipes/r1');
  });

  it('shows a custom meal card when there is no recipe link', () => {
    render(<MealDisplay meal="lunch" entry={{ ...EMPTY, main: 'Leftovers' }} recipes={[recipe]} onEdit={vi.fn()} />);
    expect(screen.getByText('Leftovers')).toBeInTheDocument();
    expect(screen.getByText(/Custom meal/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('opens the editor from the empty state', () => {
    const onEdit = vi.fn();
    render(<MealDisplay meal="dinner" entry={EMPTY} recipes={[]} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add dinner' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});

describe('MealEditForm suggestions', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits until the user stops typing before showing suggestions', () => {
    vi.useFakeTimers();
    render(<MealEditForm entry={EMPTY} recipes={[recipe]} onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Main'), { target: { value: 'carb' } });
    expect(screen.queryByRole('listbox', { name: 'Main suggestions' })).toBeNull();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('option', { name: 'Carbonara' })).toBeInTheDocument();
  });

  it('hides the suggestions once a recipe is picked', () => {
    vi.useFakeTimers();
    render(<MealEditForm entry={EMPTY} recipes={[recipe]} onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Main'), { target: { value: 'carb' } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByRole('option', { name: 'Carbonara' }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole('listbox', { name: 'Main suggestions' })).toBeNull();
  });
});

describe('MealEditForm', () => {
  it('suggests household recipes while typing and saves the link when one is picked', async () => {
    const onSave = vi.fn();
    render(<MealEditForm entry={EMPTY} recipes={[recipe]} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Main'), { target: { value: 'carb' } });
    fireEvent.click(await screen.findByRole('option', { name: 'Carbonara' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ main: 'Carbonara', mainRecipeId: 'r1' }));
  });

  it('saves custom text without a link when no suggestion is picked', () => {
    const onSave = vi.fn();
    render(<MealEditForm entry={EMPTY} recipes={[recipe]} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Main'), { target: { value: 'Toast' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ main: 'Toast', mainRecipeId: '' }));
  });

  it('drops the link when the text is changed away from the recipe title', () => {
    const onSave = vi.fn();
    render(<MealEditForm entry={{ ...EMPTY, main: 'Carbonara', mainRecipeId: 'r1' }} recipes={[recipe]} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Main'), { target: { value: 'Carbonara with peas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ mainRecipeId: '' }));
  });
});

describe('MenuListView today', () => {
  it('marks today so its heading can be shown in green', () => {
    const today = new Date();
    const id = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    render(<MenuListView days={[id]} menu={{}} recipes={[]} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('data-today', 'true');
  });
});

describe('MenuListView', () => {
  const menu: Record<string, DayMenu> = {
    '2026-10-22': { lunch: { ...EMPTY, main: 'Carbonara', mainRecipeId: 'r1' }, dinner: { ...EMPTY } },
  };

  it('lists each day with lunch and dinner, and links planned recipes', () => {
    render(<MenuListView days={['2026-10-22']} menu={menu} recipes={[recipe]} />);
    expect(screen.getByRole('link', { name: 'Carbonara' })).toHaveAttribute('href', '/recipes/r1');
    expect(screen.getAllByText('Not planned yet')).toHaveLength(1);
  });
});
