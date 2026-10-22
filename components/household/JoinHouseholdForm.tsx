'use client';

import { useState, type FormEvent } from 'react';
import { householdService as defaultService } from '../../services/dataClient';
import { HouseholdError, type HouseholdErrorCode } from '../../services/householdService';
import type { HouseholdService } from '../../types/household';
import styles from './JoinHouseholdForm.module.css';

const ERROR_MESSAGES: Record<HouseholdErrorCode, string> = {
  'invalid-invite': 'That invite code is not valid.',
  'expired-invite': 'This invite code has expired.',
  'already-member': 'You are already in this household.',
  'not-a-member': 'Only household members can create invites.',
  unknown: 'Something went wrong. Please try again.',
};

type JoinHouseholdFormProps = {
  uid: string;
  service?: HouseholdService;
};

export function JoinHouseholdForm({ uid, service = defaultService }: JoinHouseholdFormProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'joined'>('idle');
  const [error, setError] = useState<HouseholdErrorCode | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('submitting');
    try {
      await service.joinWithCode(uid, code);
      setStatus('joined');
      setCode('');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof HouseholdError ? err.code : 'unknown');
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>Join a household</h2>
      <label className={styles.field}>
        <span>Invite code</span>
        <input
          type="text"
          name="inviteCode"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {status === 'joined' && <p role="status">You joined the household.</p>}
      <button type="submit" className={styles.button} disabled={status === 'submitting'}>
        Join household
      </button>
    </form>
  );
}
