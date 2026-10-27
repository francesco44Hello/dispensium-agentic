'use client';

import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../i18n/LocaleProvider';
import { LanguageSelect } from '../i18n/LanguageSelect';
import { ProfileAvatar } from './ProfileAvatar';
import styles from './ProfileScreen.module.css';

export function ProfileScreen() {
  const { user } = useAuth();
  const { t } = useLocale();

  if (!user) return null;

  return (
    <div className={styles.screen}>
      <Link href="/" className={styles.back}>
        {t('profile.back')}
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{t('profile.title')}</h1>
        <p className={styles.subtitle}>{t('profile.subtitle')}</p>
      </header>

      <section className={styles.section}>
        <ProfileAvatar photoUrl={user.photoURL} size="large" />
        <dl className={styles.details}>
          <dt className={styles.label}>{t('profile.name')}</dt>
          <dd className={styles.value}>{user.displayName || t('profile.noName')}</dd>
          <dt className={styles.label}>{t('profile.email')}</dt>
          <dd className={styles.value}>{user.email}</dd>
        </dl>
      </section>

      <section className={styles.section}>
        <LanguageSelect />
      </section>
    </div>
  );
}
