'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { HouseholdPanel } from './HouseholdPanel';
import { JoinHouseholdForm } from './JoinHouseholdForm';
import { useLocale } from '../i18n/LocaleProvider';
import styles from './HouseholdScreen.module.css';

export function HouseholdScreen() {
  const { user } = useAuth();
  const { status, householdId } = useHousehold();
  const { t } = useLocale();

  return (
    <div className={styles.screen}>
      <Link href="/" className={styles.back}>
        {t('household.back')}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{t('household.title')}</h1>
        <p className={styles.subtitle}>{t('household.subtitle')}</p>
      </header>

      {status === 'error' && <p role="alert">{t('household.loadError')}</p>}
      {status === 'ready' && householdId && user && (
        <>
          <HouseholdPanel householdId={householdId} uid={user.uid} />
          <JoinHouseholdForm uid={user.uid} displayName={user.displayName} photoUrl={user.photoURL} />
        </>
      )}
      {status !== 'error' && status !== 'ready' && <p role="status">{t('household.loading')}</p>}
    </div>
  );
}
