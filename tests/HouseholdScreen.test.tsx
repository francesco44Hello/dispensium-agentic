// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

const state = vi.hoisted(() => ({ status: 'ready' as 'idle' | 'loading' | 'ready' | 'error' }));

vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'alice' } }) }));
vi.mock('../hooks/useHousehold', () => ({
  useHousehold: () => ({ status: state.status, householdId: 'hh-1' }),
}));
vi.mock('../components/household/HouseholdPanel', () => ({ HouseholdPanel: () => <p>members</p> }));
vi.mock('../components/household/JoinHouseholdForm', () => ({ JoinHouseholdForm: () => <p>join</p> }));

import { HouseholdScreen } from '../components/household/HouseholdScreen';

afterEach(() => {
  cleanup();
  state.status = 'ready';
});

describe('HouseholdScreen', () => {
  it('shows a visible Household page heading', () => {
    render(<HouseholdScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Household' })).toBeInTheDocument();
  });

  it('explains the page in one line under the heading', () => {
    render(<HouseholdScreen />);
    expect(screen.getByText('Share a grocery list with the people you live with.')).toBeInTheDocument();
  });

  it('keeps the heading when the household cannot be loaded', () => {
    state.status = 'error';
    render(<HouseholdScreen />);
    expect(screen.getByRole('heading', { level: 1, name: 'Household' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
