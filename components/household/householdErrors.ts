import type { HouseholdErrorCode } from '../../services/householdService';
import type { MessageKey } from '../../i18n/messages';

// The message shown for each household error. Every household component uses this one map.
export const HOUSEHOLD_ERROR_KEYS: Record<HouseholdErrorCode, MessageKey> = {
  'invalid-invite': 'household.error.invalidInvite',
  'expired-invite': 'household.error.expiredInvite',
  'already-member': 'household.error.alreadyMember',
  'not-a-member': 'household.error.notMember',
  'not-owner': 'household.error.notOwner',
  'cannot-remove': 'household.error.cannotRemove',
  removed: 'household.error.removed',
  unknown: 'error.unknown',
};
