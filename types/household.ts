import type { Unsubscribe } from './subscription';

type HouseholdRole = 'owner' | 'member';

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: Date;
}

export interface HouseholdMember {
  uid: string;
  role: HouseholdRole;
  joinedAt: Date;
}

export interface InviteCode {
  code: string;
  householdId: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
}

// The household operations the UI uses. services/householdService.ts implements it.
export interface HouseholdService {
  ensureDefaultHousehold(uid: string): Promise<string>;
  createInvite(householdId: string, uid: string): Promise<InviteCode>;
  joinWithCode(uid: string, rawCode: string): Promise<string>;
  subscribeToActiveHousehold(uid: string, listener: (householdId: string | null) => void): Unsubscribe;
  subscribeToMembers(householdId: string, listener: (members: HouseholdMember[]) => void): Unsubscribe;
}

export type HouseholdStatus = 'idle' | 'loading' | 'ready' | 'error';

export type HouseholdContextValue = {
  status: HouseholdStatus;
  householdId: string | null;
  error: string | null;
  service: HouseholdService;
};
