import { describe, it, expect } from 'vitest';
import { createHouseholdService, HouseholdError } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import { isValidInviteCode } from '../utils/inviteCode';
import type { HouseholdMember } from '../types/household';

const DAY_MS = 24 * 60 * 60 * 1000;

function setup(options: { generateCode?: () => string } = {}) {
  let clock = new Date('2026-01-01T00:00:00Z');
  const now = () => clock;
  const backend = createMemoryDataBackend({ now }).households;
  const service = createHouseholdService(backend, { now, ...options });
  return {
    backend,
    service,
    advanceDays: (days: number) => {
      clock = new Date(clock.getTime() + days * DAY_MS);
    },
  };
}

// Subscriptions emit synchronously, so the latest value is available right after subscribing.
function current<T>(subscribe: (listener: (value: T) => void) => () => void): T {
  let value!: T;
  const off = subscribe((next) => {
    value = next;
  });
  off();
  return value;
}

describe('ensureDefaultHousehold', () => {
  it('creates a household and makes the user its owner', async () => {
    const { service, backend } = setup();
    const hid = await service.ensureDefaultHousehold('alice');
    const members = current<HouseholdMember[]>((l) => backend.subscribeToMembers(hid, l));
    expect(members).toEqual([expect.objectContaining({ uid: 'alice', role: 'owner' })]);
  });

  it('returns the same household on repeated calls', async () => {
    const { service } = setup();
    const first = await service.ensureDefaultHousehold('alice');
    const second = await service.ensureDefaultHousehold('alice');
    expect(second).toBe(first);
  });

  it('creates only one household when called concurrently', async () => {
    const { service, backend } = setup();
    const [a, b] = await Promise.all([
      service.ensureDefaultHousehold('alice'),
      service.ensureDefaultHousehold('alice'),
    ]);
    expect(a).toBe(b);
    expect(current<string | null>((l) => backend.subscribeToActiveHousehold('alice', l))).toBe(a);
  });

  it('gives each user their own household', async () => {
    const { service } = setup();
    const alice = await service.ensureDefaultHousehold('alice');
    const bob = await service.ensureDefaultHousehold('bob');
    expect(bob).not.toBe(alice);
  });
});

describe('createInvite', () => {
  it('returns a valid code that expires after seven days', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice');
    const invite = await service.createInvite(hid, 'alice');
    expect(isValidInviteCode(invite.code)).toBe(true);
    expect(invite.householdId).toBe(hid);
    expect(invite.expiresAt.getTime() - invite.createdAt.getTime()).toBe(7 * DAY_MS);
  });

  it('uses the injected code generator', async () => {
    const { service } = setup({ generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    const invite = await service.createInvite(hid, 'alice');
    expect(invite.code).toBe('ABCD2345');
  });

  it('rejects an invite from a user who is not a member', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice');
    await expect(service.createInvite(hid, 'mallory')).rejects.toMatchObject({ code: 'not-a-member' });
  });
});

describe('joinWithCode', () => {
  it('adds the joiner and makes the household their active one', async () => {
    const { service, backend } = setup({ generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    await service.ensureDefaultHousehold('bob');
    await service.createInvite(hid, 'alice');

    const joined = await service.joinWithCode('bob', 'ABCD2345');

    expect(joined).toBe(hid);
    expect(current<string | null>((l) => backend.subscribeToActiveHousehold('bob', l))).toBe(hid);
    const members = current<HouseholdMember[]>((l) => backend.subscribeToMembers(hid, l));
    expect(members.map((m) => [m.uid, m.role])).toEqual([
      ['alice', 'owner'],
      ['bob', 'member'],
    ]);
  });

  it('updates existing listeners for members of the household', async () => {
    const { service, backend } = setup({ generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    await service.ensureDefaultHousehold('bob');
    await service.createInvite(hid, 'alice');

    let seen: HouseholdMember[] = [];
    const off = backend.subscribeToMembers(hid, (m) => {
      seen = m;
    });
    await service.joinWithCode('bob', 'ABCD2345');
    off();

    expect(seen).toHaveLength(2);
  });

  it('accepts a code with spaces, dashes and lowercase letters', async () => {
    const { service } = setup({ generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    await service.createInvite(hid, 'alice');
    await expect(service.joinWithCode('bob', ' abcd-2345 ')).resolves.toBe(hid);
  });

  it('rejects a malformed code with invalid-invite', async () => {
    const { service } = setup();
    await expect(service.joinWithCode('bob', 'ABC')).rejects.toMatchObject({ code: 'invalid-invite' });
  });

  it('rejects an unknown code with invalid-invite', async () => {
    const { service } = setup();
    await service.ensureDefaultHousehold('alice');
    await expect(service.joinWithCode('bob', 'ZZZZ2345')).rejects.toMatchObject({ code: 'invalid-invite' });
  });

  it('rejects an expired code with expired-invite', async () => {
    const { service, advanceDays } = setup({ generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    await service.createInvite(hid, 'alice');
    advanceDays(8);
    await expect(service.joinWithCode('bob', 'ABCD2345')).rejects.toMatchObject({ code: 'expired-invite' });
  });

  it('rejects joining a household the user already belongs to', async () => {
    const { service } = setup({ generateCode: () => 'ABCD2345' });
    const hid = await service.ensureDefaultHousehold('alice');
    await service.createInvite(hid, 'alice');
    await expect(service.joinWithCode('alice', 'ABCD2345')).rejects.toMatchObject({ code: 'already-member' });
  });

  it('throws HouseholdError instances', async () => {
    const { service } = setup();
    await expect(service.joinWithCode('bob', 'ABC')).rejects.toBeInstanceOf(HouseholdError);
  });
});
