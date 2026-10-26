'use client';

import { useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { householdService as defaultService } from '../../services/dataClient';
import { HouseholdError, type HouseholdErrorCode } from '../../services/householdService';
import type { HouseholdService, InviteCode } from '../../types/household';
import { useLocale } from '../i18n/LocaleProvider';
import type { MessageKey } from '../../i18n/messages';
import styles from './HouseholdPanel.module.css';

const ERROR_KEYS: Record<HouseholdErrorCode, MessageKey> = {
  'invalid-invite': 'household.error.invalidInvite',
  'expired-invite': 'household.error.expiredInvite',
  'already-member': 'household.error.alreadyMember',
  'not-a-member': 'household.error.notMember',
  unknown: 'error.unknown',
};

type HouseholdPanelProps = {
  householdId: string;
  uid: string;
  service?: HouseholdService;
};

export function HouseholdPanel({ householdId, uid, service = defaultService }: HouseholdPanelProps) {
  const members = useMembers(householdId, service);
  const { t } = useLocale();
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

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard access can be refused. The code stays on screen, so the user can still select it.
    }
  }

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.heading}>{t('household.members')}</h2>
        {members === null ? (
          <p role="status">{t('household.loadingMembers')}</p>
        ) : (
          <ul className={styles.members}>
            {members.map((member) => (
              <li key={member.uid} className={styles.member}>
                {member.photoUrl && (
                  // Plain img: the picture is Google's own link, shown as is.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.avatar} src={member.photoUrl} alt="" referrerPolicy="no-referrer" />
                )}
                <span className={styles.name}>
                  {member.uid === uid ? t('household.you') : member.displayName || t('household.housemate')}
                </span>
                <span className={styles.role}>{member.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{t('household.inviteTitle')}</h2>
        <button type="button" className={styles.addButton} onClick={handleCreateInvite}>
          {t('household.createInvite')}
        </button>
        {invite && (
          <>
            <div className={styles.code}>
              <code className={styles.codeText}>{invite.code}</code>
              <button type="button" className={styles.copyButton} onClick={() => handleCopy(invite.code)}>
                {t('household.copyCode')}
              </button>
            </div>
            <p className={styles.note}>{t('household.shareAfter')}</p>
          </>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {t(ERROR_KEYS[error])}
          </p>
        )}
      </section>
    </>
  );
}
