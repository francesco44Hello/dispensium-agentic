// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({
  displayName: 'Alice' as string | null,
  photoURL: null as string | null,
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { uid: 'alice', email: null, displayName: state.displayName, photoURL: state.photoURL },
  }),
}));

import { HouseholdProvider } from '../components/household/HouseholdProvider';
import type { HouseholdService } from '../types/household';

afterEach(() => {
  cleanup();
  state.displayName = 'Alice';
  state.photoURL = null;
});

function fakeService() {
  const ensureDefaultHousehold = vi.fn(async () => 'hh-1');
  const saveMemberName = vi.fn(async () => {});
  const saveMemberPhoto = vi.fn(async () => {});
  const service = {
    ensureDefaultHousehold,
    saveMemberName,
    saveMemberPhoto,
    createInvite: vi.fn(),
    joinWithCode: vi.fn(),
    subscribeToActiveHousehold: (_uid: string, listener: (id: string | null) => void) => {
      listener('hh-1');
      return () => {};
    },
    subscribeToMembers: () => () => {},
  } satisfies HouseholdService;
  return { service, ensureDefaultHousehold, saveMemberName, saveMemberPhoto };
}

describe('HouseholdProvider member names', () => {
  it('saves the signed-in name on the household member record', async () => {
    const { service, saveMemberName } = fakeService();
    render(<HouseholdProvider service={service}>{null}</HouseholdProvider>);

    await waitFor(() => expect(saveMemberName).toHaveBeenCalledWith('hh-1', 'alice', 'Alice'));
  });

  it('saves the Google profile picture on the member record', async () => {
    state.photoURL = 'https://lh3.googleusercontent.com/a/x';
    const { service, saveMemberPhoto } = fakeService();
    render(<HouseholdProvider service={service}>{null}</HouseholdProvider>);

    await waitFor(() =>
      expect(saveMemberPhoto).toHaveBeenCalledWith('hh-1', 'alice', 'https://lh3.googleusercontent.com/a/x'),
    );
  });

  it('skips the picture write when the account has no picture', async () => {
    const { service, ensureDefaultHousehold, saveMemberPhoto } = fakeService();
    render(<HouseholdProvider service={service}>{null}</HouseholdProvider>);

    await waitFor(() => expect(ensureDefaultHousehold).toHaveBeenCalled());
    expect(saveMemberPhoto).not.toHaveBeenCalled();
  });

  it('does not write an empty name', async () => {
    state.displayName = null;
    const { service, ensureDefaultHousehold, saveMemberName } = fakeService();
    render(<HouseholdProvider service={service}>{null}</HouseholdProvider>);

    await waitFor(() => expect(ensureDefaultHousehold).toHaveBeenCalled());
    expect(saveMemberName).not.toHaveBeenCalled();
  });
});
