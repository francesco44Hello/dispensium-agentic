import { sanitizeInput } from '../utils/sanitizeInput';
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '../utils/inviteCode';
import type { HouseholdMember, InviteCode } from '../types/household';
import type { Unsubscribe } from '../types/subscription';

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
  ensureDefaultHousehold(uid: string): Promise<string>;
  createInvite(householdId: string, createdBy: string, invite: InviteCode): Promise<InviteCode>;
  joinWithCode(uid: string, code: string, now: Date): Promise<string>;
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
    ensureDefaultHousehold(uid: string): Promise<string> {
      return backend.ensureDefaultHousehold(uid);
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

    async joinWithCode(uid: string, rawCode: string): Promise<string> {
      const code = normalizeInviteCode(sanitizeInput(rawCode));
      if (!isValidInviteCode(code)) throw new HouseholdError('invalid-invite');
      return backend.joinWithCode(uid, code, now());
    },

    subscribeToActiveHousehold(uid: string, listener: (householdId: string | null) => void): Unsubscribe {
      return backend.subscribeToActiveHousehold(uid, listener);
    },

    subscribeToMembers(householdId: string, listener: (members: HouseholdMember[]) => void): Unsubscribe {
      return backend.subscribeToMembers(householdId, listener);
    },
  };
}

export type HouseholdService = ReturnType<typeof createHouseholdService>;
