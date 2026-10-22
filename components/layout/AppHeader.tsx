'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdLogout, MdMenu } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import { SideMenu } from './SideMenu';
import styles from './AppHeader.module.css';

export function AppHeader() {
  const { service } = useAuth();
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
      <button type="button" className={styles.icon} aria-label="Open menu" onClick={() => setMenuOpen(true)}>
        <MdMenu aria-hidden="true" />
      </button>
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
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
