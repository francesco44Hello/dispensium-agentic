// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { HouseholdPanel } from '../components/household/HouseholdPanel';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

const PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocK=s96-c';

afterEach(() => {
  cleanup();
});

describe('HouseholdPanel photos', () => {
  it('shows the profile picture beside a member who has one', async () => {
    const service = createHouseholdService(createMemoryDataBackend().households, { generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice', 'Alice', PHOTO);

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);

    await screen.findByText('You');
    const avatar = document.querySelector('img');
    expect(avatar).not.toBeNull();
    expect(avatar?.getAttribute('src')).toBe(PHOTO);
    expect(avatar?.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('shows no picture for a member without one', async () => {
    const service = createHouseholdService(createMemoryDataBackend().households, { generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);

    await screen.findByText('You');
    expect(document.querySelector('img')).toBeNull();
  });
});
