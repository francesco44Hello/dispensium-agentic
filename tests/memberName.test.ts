import { describe, it, expect } from 'vitest';
import { cleanDisplayName } from '../utils/displayName';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import type { HouseholdMember } from '../types/household';

function setup() {
  const backend = createMemoryDataBackend().households;
  const service = createHouseholdService(backend, { generateCode: () => 'ABCD2345' });
  return { service };
}

// Subscriptions emit synchronously in the memory backend, so the latest value is available right after subscribing.
function membersOf(service: ReturnType<typeof setup>['service'], householdId: string): HouseholdMember[] {
  let value: HouseholdMember[] = [];
  service.subscribeToMembers(householdId, (members) => {
    value = members;
  });
  return value;
}

describe('cleanDisplayName', () => {
  it('trims the name and strips characters the app never accepts in external text', () => {
    expect(cleanDisplayName('  Ana <b>Rossi</b>  ')).toBe('Ana bRossi/b');
  });

  it('caps the name at 40 characters', () => {
    expect(cleanDisplayName('x'.repeat(60))).toHaveLength(40);
  });

  it('never cuts an emoji in half when it caps the length', () => {
    expect(cleanDisplayName('x'.repeat(39) + '😀')).toBe('x'.repeat(39) + '😀');
  });

  it('returns an empty string when there is no name', () => {
    expect(cleanDisplayName(null)).toBe('');
    expect(cleanDisplayName(undefined)).toBe('');
    expect(cleanDisplayName('   ')).toBe('');
  });
});

describe('household member names', () => {
  it('stores the owner name when the household is created', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice Smith');

    expect(membersOf(service, hid)[0]).toMatchObject({ uid: 'alice', displayName: 'Alice Smith' });
  });

  it('stores the joiner name when they join with a code', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');
    await service.createInvite(hid, 'alice');
    await service.joinWithCode('bob', 'ABCD2345', 'Bob');

    expect(membersOf(service, hid).find((m) => m.uid === 'bob')).toMatchObject({ displayName: 'Bob' });
  });

  it('updates a member name when the member saves it again', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice');
    await service.saveMemberName(hid, 'alice', 'Alice Renamed');

    expect(membersOf(service, hid)[0].displayName).toBe('Alice Renamed');
  });

  it('keeps names empty when no name was given, so the page can fall back', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice');

    expect(membersOf(service, hid)[0].displayName ?? '').toBe('');
  });
});
