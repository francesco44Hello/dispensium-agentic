'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { householdService as defaultService } from '../../services/dataClient';
import { HouseholdError, type HouseholdErrorCode } from '../../services/householdService';
import { HOUSEHOLD_ERROR_KEYS } from './householdErrors';
import type { HouseholdService, InvitePreview, InviteUser } from '../../types/household';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './InvitePrompt.module.css';

type InvitePromptProps = {
  code: string;
  user: InviteUser | null;
  service?: HouseholdService;
};

// The card behind a shared invite link. Signed-out people are asked to log in or sign up first,
// and the sign-in pages send them back here. Signed-in people see who invited them and can accept.
export function InvitePrompt({ code, user, service = defaultService }: InvitePromptProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<HouseholdErrorCode | null>(null);
  const [joining, setJoining] = useState(false);
  const uid = user?.uid ?? null;

  useEffect(() => {
    if (!uid) return;
    let active = true;
    service
      .previewInvite(code)
      .then((found) => {
        if (active) setPreview(found);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof HouseholdError ? err.code : 'unknown');
      });
    return () => {
      active = false;
    };
  }, [code, uid, service]);

  async function handleAccept() {
    if (!user) return;
    setJoining(true);
    setError(null);
    try {
      await service.joinWithCode(user.uid, code, user.displayName ?? '', user.photoUrl ?? '');
      router.replace('/');
    } catch (err) {
      setJoining(false);
      setError(err instanceof HouseholdError ? err.code : 'unknown');
    }
  }

  if (!user) {
    const query = encodeURIComponent(code);
    return (
      <section className={styles.card}>
        <h1 className={styles.title}>{t('invite.title')}</h1>
        <p className={styles.text}>{t('invite.logInOrSignUp')}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={`/login?invite=${query}`}>
            {t('invite.logIn')}
          </Link>
          <Link className={styles.secondary} href={`/signup?invite=${query}`}>
            {t('invite.signUp')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>{t('invite.title')}</h1>
      {error && (
        <p role="alert" className={styles.error}>
          {t(HOUSEHOLD_ERROR_KEYS[error])}
        </p>
      )}
      {preview && (
        <>
          <p className={styles.text}>{t('invite.invitedBy', { name: preview.inviterName || t('invite.someone') })}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={handleAccept} disabled={joining}>
              {t('invite.accept')}
            </button>
            <Link className={styles.secondary} href="/">
              {t('invite.notNow')}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
