// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { HouseholdPanel } from '../components/household/HouseholdPanel';
import { JoinHouseholdForm } from '../components/household/JoinHouseholdForm';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

afterEach(() => {
  cleanup();
});

function setup(generateCode?: () => string) {
  const backend = createMemoryDataBackend().households;
  const service = createHouseholdService(backend, generateCode ? { generateCode } : {});
  return { backend, service };
}

describe('HouseholdPanel', () => {
  it('lists members and marks the current user', async () => {
    const { service } = setup(() => 'ABCD2345');
    const hid = await service.ensureDefaultHousehold('alice');
    await service.ensureDefaultHousehold('bob');
    await service.createInvite(hid, 'alice');
    await service.joinWithCode('bob', 'ABCD2345');

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);

    expect(await screen.findByText(/You · owner/)).toBeTruthy();
    expect(screen.getByText('Housemate · member')).toBeTruthy();
  });

  it('creates an invite code and displays it', async () => {
    const { service } = setup(() => 'ABCD2345');
    const hid = await service.ensureDefaultHousehold('alice');

    render(<HouseholdPanel householdId={hid} uid="alice" service={service} />);
    fireEvent.click(screen.getByRole('button', { name: /create invite code/i }));

    expect(await screen.findByText('ABCD2345')).toBeTruthy();
  });
});

describe('JoinHouseholdForm', () => {
  it('shows a validation message for a malformed code', async () => {
    const { service } = setup();
    render(<JoinHouseholdForm uid="bob" service={service} />);

    fireEvent.change(screen.getByLabelText(/invite code/i), { target: { value: 'ABC' } });
    fireEvent.click(screen.getByRole('button', { name: /join household/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/not valid/i);
  });

  it('joins a household with a valid code and confirms', async () => {
    const { service } = setup(() => 'ABCD2345');
    const hid = await service.ensureDefaultHousehold('alice');
    await service.ensureDefaultHousehold('bob');
    await service.createInvite(hid, 'alice');

    render(<JoinHouseholdForm uid="bob" service={service} />);
    fireEvent.change(screen.getByLabelText(/invite code/i), { target: { value: 'abcd-2345' } });
    fireEvent.click(screen.getByRole('button', { name: /join household/i }));

    expect(await screen.findByText(/you joined the household/i)).toBeTruthy();
  });

  it('explains when the user is already in the household', async () => {
    const { service } = setup(() => 'ABCD2345');
    const hid = await service.ensureDefaultHousehold('alice');
    await service.createInvite(hid, 'alice');

    render(<JoinHouseholdForm uid="alice" service={service} />);
    fireEvent.change(screen.getByLabelText(/invite code/i), { target: { value: 'ABCD2345' } });
    fireEvent.click(screen.getByRole('button', { name: /join household/i }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/already in this household/i));
  });
});
