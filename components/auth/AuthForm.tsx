'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { AuthError, type AuthErrorCode } from '../../services/authService';
import { useLocale } from '../i18n/LocaleProvider';
import { LanguageSelect } from '../i18n/LanguageSelect';
import type { MessageKey } from '../../i18n/messages';
import styles from './AuthForm.module.css';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

// Errors are stored as message keys and translated when shown. Closing the Google popup has no message.
const ERROR_KEYS: Record<AuthErrorCode, MessageKey | null> = {
  'invalid-email': 'auth.error.invalidEmail',
  'weak-password': 'auth.error.weakPassword',
  'email-in-use': 'auth.error.emailInUse',
  'invalid-credentials': 'auth.error.invalidCredentials',
  'name-required': 'auth.error.nameRequired',
  'popup-closed': null,
  unknown: 'error.unknown',
};

export function AuthForm({ mode }: AuthFormProps) {
  const { service, status } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<MessageKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await service.signInWithGoogle();
      router.replace('/');
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'unknown';
      // Closing the Google popup is a deliberate choice, so no error is shown.
      if (code !== 'popup-closed') setError(ERROR_KEYS[code]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSignup && password !== confirmPassword) {
      setError('auth.error.passwordMismatch');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await service.signUp(email, password, name);
      } else {
        await service.signIn(email, password);
      }
      router.replace('/');
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'unknown';
      setError(ERROR_KEYS[code]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>{isSignup ? t('auth.signup') : t('auth.login')}</h1>

      {isSignup && (
        <label className={styles.field}>
          <span>{t('auth.name')}</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
      )}

      <label className={styles.field}>
        <span>{t('auth.email')}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      <label className={styles.field}>
        <span>{t('auth.password')}</span>
        <input
          type="password"
          name="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {isSignup && (
        <label className={styles.field}>
          <span>{t('auth.confirmPassword')}</span>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {t(error)}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? t('auth.submit.wait') : isSignup ? t('auth.submit.signup') : t('auth.login')}
      </button>

      <div className={styles.divider} role="separator">
        <span>{t('auth.or')}</span>
      </div>

      <button type="button" className={styles.google} onClick={handleGoogleSignIn} disabled={submitting}>
        {t('auth.google')}
      </button>

      <p className={styles.switch}>
        {isSignup ? (
          <>
            {t('auth.haveAccount')} <Link href="/login">{t('auth.login')}</Link>
          </>
        ) : (
          <>
            {t('auth.newHere')} <Link href="/signup">{t('auth.createAccountLink')}</Link>
          </>
        )}
      </p>

      <div className={styles.language}>
        <LanguageSelect />
      </div>
    </form>
  );
}
