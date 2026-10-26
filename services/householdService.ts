import { sanitizeInput } from '../utils/sanitizeInput';
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '../utils/inviteCode';
import type { HouseholdMember, HouseholdService, InviteCode } from '../types/household';
import type { Unsubscribe } from '../types/subscription';
import { cleanDisplayName } from '../utils/displayName';
import { cleanPhotoUrl } from '../utils/photoUrl';

export type HouseholdErrorCode =
  | 'invalid-invite'
  | 'expired-invite'
  | 'already-member'
  | 'not-a-member'
  | 'unknown';

export class HouseholdError extends Error {
  code: HouseholdErrorCode;

  constructor(code: HouseholdErrorCode) {
    super(code);
    this.name = 'HouseholdError';
    this.code = code;
  }
}

export interface HouseholdBackend {
  ensureDefaultHousehold(uid: string, displayName: string, photoUrl: string): Promise<string>;
  createInvite(householdId: string, createdBy: string, invite: InviteCode): Promise<InviteCode>;
  joinWithCode(uid: string, code: string, now: Date, displayName: string, photoUrl: string): Promise<string>;
  saveMemberName(householdId: string, uid: string, displayName: string): Promise<void>;
  saveMemberPhoto(householdId: string, uid: string, photoUrl: string): Promise<void>;
  subscribeToActiveHousehold(uid: string, listener: (householdId: string | null) => void): Unsubscribe;
  subscribeToMembers(householdId: string, listener: (members: HouseholdMember[]) => void): Unsubscribe;
}

export interface HouseholdServiceOptions {
  now?: () => Date;
  inviteTtlMs?: number;
  generateCode?: () => string;
}

const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function createHouseholdService(backend: HouseholdBackend, options: HouseholdServiceOptions = {}) {
  const now = options.now ?? (() => new Date());
  const inviteTtlMs = options.inviteTtlMs ?? DEFAULT_INVITE_TTL_MS;
  const generateCode = options.generateCode ?? (() => generateInviteCode());

  return {
    ensureDefaultHousehold(uid: string, displayName = '', photoUrl = ''): Promise<string> {
      return backend.ensureDefaultHousehold(uid, cleanDisplayName(displayName), cleanPhotoUrl(photoUrl));
    },

    async createInvite(householdId: string, uid: string): Promise<InviteCode> {
      const createdAt = now();
      const invite: InviteCode = {
        code: generateCode(),
        householdId,
        createdBy: uid,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + inviteTtlMs),
      };
      return backend.createInvite(householdId, uid, invite);
    },

    async joinWithCode(uid: string, rawCode: string, displayName = '', photoUrl = ''): Promise<string> {
      const code = normalizeInviteCode(sanitizeInput(rawCode));
      if (!isValidInviteCode(code)) throw new HouseholdError('invalid-invite');
      return backend.joinWithCode(uid, code, now(), cleanDisplayName(displayName), cleanPhotoUrl(photoUrl));
    },

    saveMemberPhoto(householdId: string, uid: string, photoUrl: string): Promise<void> {
      return backend.saveMemberPhoto(householdId, uid, cleanPhotoUrl(photoUrl));
    },

    saveMemberName(householdId: string, uid: string, displayName: string): Promise<void> {
      return backend.saveMemberName(householdId, uid, cleanDisplayName(displayName));
    },

    subscribeToActiveHousehold(uid: string, listener: (householdId: string | null) => void): Unsubscribe {
      return backend.subscribeToActiveHousehold(uid, listener);
    },

    subscribeToMembers(householdId: string, listener: (members: HouseholdMember[]) => void): Unsubscribe {
      return backend.subscribeToMembers(householdId, listener);
    },
  } satisfies HouseholdService;
}
