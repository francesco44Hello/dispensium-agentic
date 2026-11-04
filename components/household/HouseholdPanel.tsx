'use client';

import { useEffect, useState } from 'react';
import { useMembers } from '../../hooks/useMembers';
import { householdService as defaultService } from '../../services/dataClient';
import { HouseholdError, type HouseholdErrorCode } from '../../services/householdService';
import { HOUSEHOLD_ERROR_KEYS } from './householdErrors';
import type { HouseholdMember, HouseholdService, InviteCode, RemovedMember } from '../../types/household';
import { buildInviteLink } from '../../utils/inviteLink';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './HouseholdPanel.module.css';

type HouseholdPanelProps = {
  householdId: string;
  uid: string;
  service?: HouseholdService;
};

export function HouseholdPanel({ householdId, uid, service = defaultService }: HouseholdPanelProps) {
  const members = useMembers(householdId, service);
  const { t } = useLocale();
  const [invite, setInvite] = useState<InviteCode | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<HouseholdErrorCode | null>(null);
  const [removed, setRemoved] = useState<RemovedMember[]>([]);

  const self = members?.find((member) => member.uid === uid);
  const isOwner = self?.role === 'owner';
  const inviteLink = invite ? buildInviteLink(window.location.origin, invite.code) : '';

  // Only the owner may read the removed list, so members never subscribe to it.
  useEffect(() => {
    if (!isOwner) return;
    return service.subscribeToRemovedMembers(householdId, setRemoved);
  }, [isOwner, householdId, service]);

  async function handleCreateInvite() {
    setError(null);
    setCopied(false);
    try {
      // The inviter's name is shown to the person on the join card.
      const created = await service.createInvite(householdId, uid, self?.displayName ?? '');
      setInvite(created);
      await handleCopy(buildInviteLink(window.location.origin, created.code));
    } catch (err) {
      setError(err instanceof HouseholdError ? err.code : 'unknown');
    }
  }

  async function handleCopy(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard access can be refused. The link stays on screen, so the owner can still select and copy it.
      setCopied(false);
    }
  }

  async function handleRemove(member: HouseholdMember, name: string) {
    if (!window.confirm(t('household.removeConfirm', { name }))) return;
    setError(null);
    try {
      await service.removeMember(householdId, uid, member.uid);
    } catch (err) {
      setError(err instanceof HouseholdError ? err.code : 'unknown');
    }
  }

  async function handleReadmit(member: RemovedMember) {
    if (!window.confirm(t('household.readmitConfirm', { name: member.displayName || t('household.housemate') }))) return;
    setError(null);
    try {
      await service.readmitMember(householdId, uid, member.uid);
    } catch (err) {
      setError(err instanceof HouseholdError ? err.code : 'unknown');
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
            {members.map((member) => {
              const name = member.uid === uid ? t('household.you') : member.displayName || t('household.housemate');
              const canRemove = isOwner && member.uid !== uid && member.role !== 'owner';
              return (
                <li key={member.uid} className={styles.member}>
                  {member.photoUrl && (
                    // Plain img: the picture is Google's own link, shown as is.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.avatar} src={member.photoUrl} alt="" referrerPolicy="no-referrer" />
                  )}
                  <span className={styles.name}>{name}</span>
                  <span className={styles.role}>{member.role}</span>
                  {canRemove && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label={t('household.removeMember', { name })}
                      onClick={() => handleRemove(member, name)}
                    >
                      {t('household.remove')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isOwner && (
        <section className={styles.section}>
          <h2 className={styles.heading}>{t('household.inviteTitle')}</h2>
          <button type="button" className={styles.addButton} onClick={handleCreateInvite}>
            {t('household.createInvite')}
          </button>
          {invite && (
            <>
              <div className={styles.code}>
                <code className={styles.codeText}>{inviteLink}</code>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => handleCopy(inviteLink)}
                >
                  {t('household.copyLink')}
                </button>
              </div>
              <p className={styles.note}>{copied ? t('household.linkCopied') : t('household.linkValid')}</p>
            </>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {t(HOUSEHOLD_ERROR_KEYS[error])}
            </p>
          )}
        </section>
      )}

      {isOwner && removed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>{t('household.removedTitle')}</h2>
          <ul className={styles.members}>
            {removed.map((member) => {
              const name = member.displayName || t('household.housemate');
              return (
                <li key={member.uid} className={styles.member}>
                  <span className={styles.name}>{name}</span>
                  <button
                    type="button"
                    className={styles.copyButton}
                    aria-label={t('household.readmitMember', { name })}
                    onClick={() => handleReadmit(member)}
                  >
                    {t('household.readmit')}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!isOwner && error && (
        <p role="alert" className={styles.error}>
          {t(HOUSEHOLD_ERROR_KEYS[error])}
        </p>
      )}
    </>
  );
}
