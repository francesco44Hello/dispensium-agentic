'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { householdService as defaultService } from '../../services/dataClient';
import { hasCode } from '../../utils/hasCode';
import type { HouseholdContextValue, HouseholdService, HouseholdStatus } from '../../types/household';

function errorCodeOf(err: unknown): string {
  return hasCode(err) ? err.code : 'unknown';
}

export const HouseholdContext = createContext<HouseholdContextValue | null>(null);

type HouseholdProviderProps = {
  children: ReactNode;
  service?: HouseholdService;
};

type HouseholdState = {
  forUid: string;
  status: Exclude<HouseholdStatus, 'idle' | 'loading'>;
  householdId: string | null;
  error: string | null;
};

// Ensures the signed-in user has a default household, then follows their active household
// (which changes when they join another one via invite code).
// State is keyed by uid, so a previous user's household is never shown to someone else.
export function HouseholdProvider({ children, service = defaultService }: HouseholdProviderProps) {
  const { status: authStatus, user } = useAuth();
  const [state, setState] = useState<HouseholdState | null>(null);
  const uid = user?.uid ?? null;
  const name = user?.displayName ?? '';
  const photo = user?.photoURL ?? '';

  useEffect(() => {
    if (authStatus === 'loading' || !uid) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    service
      .ensureDefaultHousehold(uid, name, photo)
      .then((householdId) => {
        if (!active) return;
        // Keep the saved name current, so housemates see the same name the user signs in with.
        if (name) {
          service.saveMemberName(householdId, uid, name).catch((err: unknown) => {
            console.error('Could not save member name:', err);
          });
        }
        if (photo) {
          service.saveMemberPhoto(householdId, uid, photo).catch((err: unknown) => {
            console.error('Could not save member photo:', err);
          });
        }
        unsubscribe = service.subscribeToActiveHousehold(uid, (householdId) => {
          if (!active) return;
          setState({
            forUid: uid,
            status: householdId ? 'ready' : 'error',
            householdId,
            error: householdId ? null : 'no-active-household',
          });
        });
      })
      .catch((err: unknown) => {
        // Surface the real reason (e.g. Firestore permission-denied) instead of a generic message.
        console.error('Could not load household:', err);
        if (active) setState({ forUid: uid, status: 'error', householdId: null, error: errorCodeOf(err) });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [authStatus, uid, name, photo, service]);

  let value: HouseholdContextValue;
  if (!uid) {
    value = { status: 'idle', householdId: null, error: null, service };
  } else if (state?.forUid !== uid) {
    value = { status: 'loading', householdId: null, error: null, service };
  } else {
    value = { status: state.status, householdId: state.householdId, error: state.error, service };
  }

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}
