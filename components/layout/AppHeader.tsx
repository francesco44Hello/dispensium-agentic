'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MdLogout, MdMenu } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const { service } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await service.signOut();
    router.replace('/login');
  }

  return (
    <header className={styles.header}>
      <Link href="/household" className={styles.icon} aria-label="Open household menu">
        <MdMenu aria-hidden="true" />
      </Link>
      <h1 className={styles.title}>Dispensium</h1>
      <button
        type="button"
        className={styles.icon}
        aria-label="Log out"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <MdLogout aria-hidden="true" />
      </button>
    </header>
  );
}
