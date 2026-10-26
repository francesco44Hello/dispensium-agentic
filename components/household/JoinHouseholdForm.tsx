'use client';

import { useState, type FormEvent } from 'react';
import { householdService as defaultService } from '../../services/dataClient';
import { HouseholdError, type HouseholdErrorCode } from '../../services/householdService';
import type { HouseholdService } from '../../types/household';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './JoinHouseholdForm.module.css';

const ERROR_KEYS: Record<HouseholdErrorCode, MessageKey> = {
  'invalid-invite': 'household.error.invalidInvite',
  'expired-invite': 'household.error.expiredInvite',
  'already-member': 'household.error.alreadyMember',
  'not-a-member': 'household.error.notMember',
  unknown: 'error.unknown',
};

type JoinHouseholdFormProps = {
  uid: string;
  displayName?: string | null;
  photoUrl?: string | null;
  service?: HouseholdService;
};

export function JoinHouseholdForm({ uid, displayName, photoUrl, service = defaultService }: JoinHouseholdFormProps) {
  const [code, setCode] = useState('');
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'joined'>('idle');
  const [error, setError] = useState<HouseholdErrorCode | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('submitting');
    try {
      await service.joinWithCode(uid, code, displayName ?? '', photoUrl ?? '');
      setStatus('joined');
      setCode('');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof HouseholdError ? err.code : 'unknown');
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.heading}>{t('household.joinTitle')}</h2>
      <label className={styles.field}>
        <span>{t('household.inviteCode')}</span>
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
          {t(ERROR_KEYS[error])}
        </p>
      )}
      {status === 'joined' && <p role="status">{t('household.joined')}</p>}
      <button type="submit" className={styles.button} disabled={status === 'submitting'}>
        {t('household.joinButton')}
      </button>
    </form>
  );
}
