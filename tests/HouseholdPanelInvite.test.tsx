// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdPanel } from '../components/household/HouseholdPanel';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setup() {
  const backend = createMemoryDataBackend().households;
  return createHouseholdService(backend, { generateCode: () => 'ABCD2345' });
}

// alice (owner, "Alice") and bob (member, "Bob") share a household.
async function householdWithBob() {
  const service = setup();
  const hid = await service.ensureDefaultHousehold('alice', 'Alice');
  await service.createInvite(hid, 'alice', 'Alice');
  await service.joinWithCode('bob', 'ABCD2345', 'Bob');
  return { service, hid };
}

describe('HouseholdPanel shared invite link', () => {
  it('creates the link, copies it straight away, and shows it', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const service = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);
    fireEvent.click(screen.getByRole('button', { name: /create invite link/i }));

    const link = `${window.location.origin}/join/ABCD2345`;
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link));
    expect(await screen.findByText(link)).toBeTruthy();
  });

  it('lets the owner remove a member after confirming', async () => {
    const { service, hid } = await householdWithBob();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove Bob' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove Bob' })).toBeNull());
    expect(await screen.findByRole('button', { name: 'Add back Bob' })).toBeTruthy();
    // Bob's name appears once, in the Removed section, so he is not in the members list any more.
    expect(screen.getAllByText('Bob')).toHaveLength(1);
  });

  it('keeps the member when the owner cancels the removal', async () => {
    const { service, hid } = await householdWithBob();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove Bob' }));

    expect(await screen.findByText('Bob')).toBeTruthy();
  });

  it('shows no invite or remove controls to a member, and no remove button on the owner', async () => {
    const { service, hid } = await householdWithBob();

    render(<HouseholdPanel householdId={hid} uid="bob" service={service} />);

    expect(await screen.findByText('Alice')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /create invite link/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^remove/i })).toBeNull();
  });

  it('does not offer to remove the owner themselves', async () => {
    const { service, hid } = await householdWithBob();

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);

    await screen.findByRole('button', { name: 'Remove Bob' });
    expect(screen.queryByRole('button', { name: 'Remove Alice' })).toBeNull();
  });
});

describe('HouseholdPanel removed members', () => {
  it('lists removed members for the owner, and adds one back after confirming', async () => {
    const { service, hid } = await householdWithBob();
    await service.removeMember(hid, 'alice', 'bob');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add back Bob' }));

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Add back Bob' })).toBeNull());
    await expect(service.joinWithCode('bob', 'ABCD2345', 'Bob')).resolves.toBe(hid);
  });

  it('does not show the removed list to a member', async () => {
    const { service, hid } = await householdWithBob();
    await service.joinWithCode('carol', 'ABCD2345', 'Carol');
    await service.removeMember(hid, 'alice', 'bob');

    render(<HouseholdPanel householdId={hid} uid="carol" service={service} />);

    expect(await screen.findByText('Alice')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add back/i })).toBeNull();
  });
});
