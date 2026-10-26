import { describe, it, expect } from 'vitest';
import { createHouseholdService } from '../services/householdService';
import { createMemoryDataBackend } from '../services/dataBackends/memoryDataBackend';
import type { HouseholdMember } from '../types/household';

const PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocK=s96-c';

function setup() {
  const service = createHouseholdService(createMemoryDataBackend().households, { generateCode: () => 'ABCD2345' });
  return { service };
}

function membersOf(service: ReturnType<typeof setup>['service'], householdId: string): HouseholdMember[] {
  let value: HouseholdMember[] = [];
  service.subscribeToMembers(householdId, (members) => {
    value = members;
  });
  return value;
}

describe('member photos', () => {
  it('stores the Google profile picture on the owner when the household is created', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice', PHOTO);

    expect(membersOf(service, hid)[0].photoUrl).toBe(PHOTO);
  });

  it('stores the picture of a joiner who joins with a code', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');
    await service.createInvite(hid, 'alice');
    await service.joinWithCode('bob', 'ABCD2345', 'Bob', PHOTO);

    expect(membersOf(service, hid).find((m) => m.uid === 'bob')?.photoUrl).toBe(PHOTO);
  });

  it('saves a picture for an existing member', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice');
    await service.saveMemberPhoto(hid, 'alice', PHOTO);

    expect(membersOf(service, hid)[0].photoUrl).toBe(PHOTO);
  });

  it('leaves the picture off members who have none, such as email sign-ups', async () => {
    const { service } = setup();
    const hid = await service.ensureDefaultHousehold('alice', 'Alice');

    expect(membersOf(service, hid)[0]).not.toHaveProperty('photoUrl');
  });
});
