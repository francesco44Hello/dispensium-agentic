'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { isMockAuth } from '../../services/authClient';
import { hasCode } from '../../utils/hasCode';
import styles from './AuthTestPanel.module.css';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

export function AuthTestPanel() {
  const { status, user, service } = useAuth();
  const { householdId, status: householdStatus } = useHousehold();
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const record = (message: string) => setLog((prev) => [`${new Date().toLocaleTimeString()} — ${message}`, ...prev].slice(0, 20));

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      record(`${label}: ok`);
    } catch (err) {
      const reason = hasCode(err) ? err.code : err instanceof Error ? err.message : 'unknown';
      record(`${label}: ${reason}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Auth test panel</h1>
      <p className={styles.meta}>Backend: <strong>{isMockAuth ? 'mock (in-memory)' : 'Firebase'}</strong></p>
      <p className={styles.meta}>Status: <strong>{status}</strong></p>
      <p className={styles.meta}>User: {user ? `${user.email} (${user.uid})` : 'none'}</p>
      <p className={styles.meta}>Household: {householdStatus} {householdId ?? ''}</p>

      <div className={styles.actions}>
        {isMockAuth && (
          <>
            <button type="button" disabled={busy} onClick={() => run('Create demo account', () => service.signUp(DEMO_EMAIL, DEMO_PASSWORD).catch((e) => { if (e.code !== 'email-in-use') throw e; }))}>
              Create demo account
            </button>
            <button type="button" disabled={busy} onClick={() => run('Sign in demo account', () => service.signIn(DEMO_EMAIL, DEMO_PASSWORD))}>
              Sign in demo account
            </button>
          </>
        )}
        <button type="button" disabled={busy || !user} onClick={() => run('Log out', () => service.signOut())}>
          Log out
        </button>
      </div>

      <nav className={styles.nav}>
        <Link href="/">Protected home (/)</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign up</Link>
      </nav>

      <h2 className={styles.subtitle}>Event log</h2>
      <ul className={styles.log}>
        {log.length === 0 && <li>No actions yet.</li>}
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </section>
  );
}
