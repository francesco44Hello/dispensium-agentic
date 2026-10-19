'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './layout/AppHeader';
import { BottomNav } from './layout/BottomNav';
import styles from './AppShell.module.css';

// Page chrome for the signed-in app: header on top, bottom tab bar fixed at the bottom.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={styles.content}>{children}</main>
      <BottomNav />
    </div>
  );
}
