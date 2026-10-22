// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  household: { status: 'ready' as 'ready' | 'loading' | 'error', householdId: 'hh-1' as string | null, error: null as string | null },
  stopMenu: vi.fn(),
  stopRecipes: vi.fn(),
  subscribeToMenu: vi.fn(),
  subscribeToRecipes: vi.fn(),
  setMeal: vi.fn(),
}));

vi.mock('../hooks/useHousehold', () => ({ useHousehold: () => mocks.household }));
vi.mock('../components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../services/dataClient', () => ({
  menuService: { subscribeToMenu: mocks.subscribeToMenu, setMeal: mocks.setMeal },
  recipeService: { subscribeToRecipes: mocks.subscribeToRecipes },
}));

import { MenuScreen } from '../components/menu/MenuScreen';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.household.status = 'ready';
  mocks.household.householdId = 'hh-1';
  mocks.household.error = null;
  mocks.subscribeToMenu.mockImplementation(() => mocks.stopMenu);
  mocks.subscribeToRecipes.mockImplementation(() => mocks.stopRecipes);
});

mocks.subscribeToMenu.mockImplementation(() => mocks.stopMenu);
mocks.subscribeToRecipes.mockImplementation(() => mocks.stopRecipes);

describe('MenuScreen', () => {
  it('shows a loading message until the household is ready', () => {
    mocks.household.status = 'loading';
    mocks.household.householdId = null;
    render(<MenuScreen />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading menu');
    expect(mocks.subscribeToMenu).not.toHaveBeenCalled();
  });

  it('shows an alert when the household cannot be loaded', () => {
    mocks.household.status = 'error';
    mocks.household.error = 'offline';
    render(<MenuScreen />);
    expect(screen.getByRole('alert')).toHaveTextContent('offline');
  });

  it('listens to today onward, and stops listening when it closes', () => {
    const { unmount } = render(<MenuScreen />);
    expect(mocks.subscribeToMenu).toHaveBeenCalledWith('hh-1', expect.arrayContaining([expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)]), expect.any(Function));
    expect(mocks.subscribeToMenu.mock.calls[0][1]).toHaveLength(7);
    unmount();
    expect(mocks.stopMenu).toHaveBeenCalledTimes(1);
    expect(mocks.stopRecipes).toHaveBeenCalledTimes(1);
  });

  it('shows an alert when a meal cannot be saved', async () => {
    mocks.setMeal.mockRejectedValueOnce(new Error('rejected'));
    render(<MenuScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Add lunch' }));
    fireEvent.change(screen.getByLabelText('Main'), { target: { value: 'Soup' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Could not save the meal'));
  });
});
