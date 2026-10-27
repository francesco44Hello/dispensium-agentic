import { vi } from 'vitest';
import { createHouseholdService } from '../services/householdService';
import type { HouseholdMember } from '../types/household';

// A household service backed by fakes, so component tests never touch Firestore.
export function createHouseholdStub(members: HouseholdMember[] = []) {
  const saveMemberName = vi.fn<(householdId: string, uid: string, displayName: string) => Promise<void>>(async () => undefined);
  const saveMemberPhoto = vi.fn<(householdId: string, uid: string, photoUrl: string) => Promise<void>>(async () => undefined);
  const service = createHouseholdService({
    ensureDefaultHousehold: async () => 'hh-1',
    createInvite: async () => {
      throw new Error('not used in these tests');
    },
    joinWithCode: async () => 'hh-1',
    saveMemberName,
    saveMemberPhoto,
    subscribeToActiveHousehold: () => () => undefined,
    subscribeToMembers: (_householdId, listener) => {
      listener(members);
      return () => undefined;
    },
  });
  return { service, saveMemberName, saveMemberPhoto };
}
