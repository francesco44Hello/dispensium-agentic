// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { HouseholdPanel } from '../components/household/HouseholdPanel';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

afterEach(() => {
  cleanup();
});

describe('HouseholdPanel member names', () => {
  it('shows a housemate by their saved name instead of the generic label', async () => {
    const service = createHouseholdService(createMemoryDataBackend().households, { generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');
    await service.createInvite(hid, 'alice');
    await service.joinWithCode('bob', 'ABCD2345', 'Bob Jones');

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);

    expect(await screen.findByText('Bob Jones')).toBeTruthy();
    expect(screen.queryByText('Housemate')).toBeNull();
  });

  it('falls back to the generic label when a member has no saved name', async () => {
    const service = createHouseholdService(createMemoryDataBackend().households, { generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    await service.createInvite(hid, 'alice');
    await service.joinWithCode('bob', 'ABCD2345');

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);

    expect(await screen.findByText('Housemate')).toBeTruthy();
  });
});
