'use client';

import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { GroceryList } from './GroceryList';

export function GroceryScreen() {
  const { user } = useAuth();
  const { status, householdId, error } = useHousehold();

  if (status === 'error') {
    return (
      <p role="alert">
        We could not load your household ({error ?? 'unknown error'}). Please refresh the page.
      </p>
    );
  }
  if (status !== 'ready' || !householdId || !user) {
    return <p role="status">Loading list…</p>;
  }
  return <GroceryList householdId={householdId} uid={user.uid} />;
}
