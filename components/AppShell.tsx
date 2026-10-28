'use client';

import type { ReactNode } from 'react';
import { AppHeader } from './layout/AppHeader';
import { AppFooter } from './layout/AppFooter';
import { BottomNav } from './layout/BottomNav';
import styles from './AppShell.module.css';

// Page chrome for the signed-in app: header on top, bottom tab bar fixed at the bottom.
interface Props {
  children: ReactNode;
  onAdd?: () => void;
  // Hides the header, e.g. on the recipe page where the photo has its own back button.
  hideHeader?: boolean;
  // Removes the side gutter so the page content can run edge to edge.
  bleed?: boolean;
  // Skips the room the shell reserves under the bar, for pages that space their own bottom edge.
  flushBottom?: boolean;
  // Leaves out the navigation bar and the desktop footer, for a full page with its own way back (the desktop add recipe form).
  hideNav?: boolean;
}

export function AppShell({ children, onAdd, hideHeader = false, bleed = false, flushBottom = false, hideNav = false }: Props) {
  return (
    <div className={`${styles.shell} ${bleed ? styles.bleed : ''}`}>
      {!hideHeader && <AppHeader />}
      <main className={`${styles.content} ${bleed ? styles.bleed : ''} ${flushBottom ? styles.flushBottom : ''}`}>{children}</main>
      {!hideNav && <BottomNav onAdd={onAdd} />}
      {!hideNav && <AppFooter />}
    </div>
  );
}
