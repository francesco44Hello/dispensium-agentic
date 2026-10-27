'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MdMenu } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../i18n/LocaleProvider';
import { useProfilePhoto } from '../../hooks/useProfilePhoto';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { SideMenu } from './SideMenu';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const { service } = useAuth();
  const profilePhoto = useProfilePhoto();
  const { t } = useLocale();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await service.signOut();
    router.replace('/login');
  }

  return (
    <header className={styles.header}>
      <button type="button" className={styles.icon} aria-label={t('nav.openMenu')} onClick={() => setMenuOpen(true)}>
        <MdMenu aria-hidden="true" />
      </button>
      <h1 className={styles.title}>Dispensium</h1>
      <Link href="/profile" className={styles.profile} aria-label={t('nav.profile')}>
        <ProfileAvatar photoUrl={profilePhoto} />
      </Link>
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} onSignOut={handleSignOut} signingOut={signingOut} />
    </header>
  );
}
