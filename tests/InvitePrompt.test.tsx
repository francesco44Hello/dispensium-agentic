// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

import { InvitePrompt } from '../components/household/InvitePrompt';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';

afterEach(() => {
  cleanup();
  replace.mockReset();
});

function setup() {
  const backend = createMemoryDataBackend().households;
  return createHouseholdService(backend, { generateCode: () => 'ABCD2345' });
}

const mum = { uid: 'mum', displayName: 'Mum', photoUrl: '' };

describe('InvitePrompt', () => {
  it('asks a signed-out person to log in or sign up, keeping the invite', () => {
    render(<InvitePrompt code="ABCD2345" user={null} service={setup()} />);

    expect(screen.getByRole('link', { name: /log in/i }).getAttribute('href')).toBe('/login?invite=ABCD2345');
    expect(screen.getByRole('link', { name: /sign up/i }).getAttribute('href')).toBe('/signup?invite=ABCD2345');
  });

  it('shows who invited them, and joins the household on accept', async () => {
    const service = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');
    await service.createInvite(hid, 'alice', 'Alice');

    render(<InvitePrompt code="ABCD2345" user={mum} service={service} />);

    expect(await screen.findByText('Alice invited you to join their household')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('uses a generic name when the inviter has none', async () => {
    const service = setup();
    const hid = await service.ensureDefaultHousehold('alice');
    await service.createInvite(hid, 'alice', '');

    render(<InvitePrompt code="ABCD2345" user={mum} service={service} />);

    expect(await screen.findByText('Someone invited you to join their household')).toBeTruthy();
  });

  it('explains that the link is not valid, without offering to join', async () => {
    render(<InvitePrompt code="ABCD2345" user={mum} service={setup()} />);

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /accept/i })).toBeNull();
  });
});
