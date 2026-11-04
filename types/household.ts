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
  // Name from the member's sign-up form or Google profile. Missing for members who have not saved one yet.
  displayName?: string;
  // Google profile picture link, when the account has one.
  photoUrl?: string;
}

export interface InviteCode {
  code: string;
  householdId: string;
  createdBy: string;
  // Shown on the join card as "<name> invited you". Empty when the owner has no name saved.
  inviterName: string;
  createdAt: Date;
  expiresAt: Date;
}

// The signed-in person who accepts an invite. Taken from the auth user.
export interface InviteUser {
  uid: string;
  displayName: string | null;
  photoUrl: string | null;
}

// What the join card shows before the person accepts.
export interface InvitePreview {
  code: string;
  inviterName: string;
}

// The household operations the UI uses. services/householdService.ts implements it.
export interface HouseholdService {
  ensureDefaultHousehold(uid: string, displayName?: string, photoUrl?: string): Promise<string>;
  createInvite(householdId: string, uid: string, inviterName: string): Promise<InviteCode>;
  previewInvite(rawCode: string): Promise<InvitePreview>;
  joinWithCode(uid: string, rawCode: string, displayName?: string, photoUrl?: string): Promise<string>;
  removeMember(householdId: string, actorUid: string, targetUid: string): Promise<void>;
  saveMemberName(householdId: string, uid: string, displayName: string): Promise<void>;
  saveMemberPhoto(householdId: string, uid: string, photoUrl: string): Promise<void>;
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
