'use client';

import { useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { householdService as defaultService } from '../../services/dataClient';
import { HouseholdError, type HouseholdErrorCode } from '../../services/householdService';
import type { HouseholdService, InviteCode } from '../../types/household';
import styles from './HouseholdPanel.module.css';

const ERROR_MESSAGES: Record<HouseholdErrorCode, string> = {
  'invalid-invite': 'That invite code is not valid.',
  'expired-invite': 'This invite code has expired.',
  'already-member': 'You are already in this household.',
  'not-a-member': 'Only household members can create invites.',
  unknown: 'Something went wrong. Please try again.',
};

type HouseholdPanelProps = {
  householdId: string;
  uid: string;
  service?: HouseholdService;
};

export function HouseholdPanel({ householdId, uid, service = defaultService }: HouseholdPanelProps) {
  const members = useMembers(householdId, service);
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [error, setError] = useState<HouseholdErrorCode | null>(null);

  async function handleCreateInvite() {
    setError(null);
    try {
      setInvite(await service.createInvite(householdId, uid));
    } catch (err) {
      setError(err instanceof HouseholdError ? err.code : 'unknown');
    }
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>Members</h2>
      {members === null ? (
        <p role="status">Loading members…</p>
      ) : (
        <ul className={styles.members}>
          {members.map((member) => (
            <li key={member.uid}>
              {member.uid === uid ? 'You' : 'Housemate'} · {member.role}
            </li>
          ))}
        </ul>
      )}

      <h2 className={styles.heading}>Invite a housemate</h2>
      <button type="button" className={styles.button} onClick={handleCreateInvite}>
        Create invite code
      </button>
      {invite && (
        <p className={styles.invite}>
          Share this code: <code>{invite.code}</code> (valid for 7 days)
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {ERROR_MESSAGES[error]}
        </p>
      )}
    </section>
  );
}
