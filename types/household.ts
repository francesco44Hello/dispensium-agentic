export type HouseholdRole = 'owner' | 'member';

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
