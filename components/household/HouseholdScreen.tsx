'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { HouseholdPanel } from './HouseholdPanel';
import { JoinHouseholdForm } from './JoinHouseholdForm';
import styles from './HouseholdScreen.module.css';

export function HouseholdScreen() {
  const { user } = useAuth();
  const { status, householdId } = useHousehold();

  return (
    <div className={styles.screen}>
      <Link href="/" className={styles.back}>
        ← Back to list
      </Link>

      {status === 'error' && <p role="alert">We could not load your household. Please refresh the page.</p>}
      {status === 'ready' && householdId && user && (
        <>
          <HouseholdPanel householdId={householdId} uid={user.uid} />
          <JoinHouseholdForm uid={user.uid} />
        </>
      )}
      {status !== 'error' && status !== 'ready' && <p role="status">Loading…</p>}
    </div>
  );
}
