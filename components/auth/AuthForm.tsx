'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { AuthError, type AuthErrorCode } from '../../services/authService';
import styles from './AuthForm.module.css';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-email': 'Please enter a valid email address.',
  'weak-password': 'Password must be at least 6 characters.',
  'email-in-use': 'An account with this email already exists.',
  'invalid-credentials': 'Email or password is incorrect.',
  'popup-closed': '',
  unknown: 'Something went wrong. Please try again.',
};

export function AuthForm({ mode }: AuthFormProps) {
  const { service, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      if (code !== 'popup-closed') setError(ERROR_MESSAGES[code]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await service.signUp(email, password);
      } else {
        await service.signIn(email, password);
      }
      router.replace('/');
    } catch (err) {
      const code = err instanceof AuthError ? err.code : 'unknown';
      setError(ERROR_MESSAGES[code]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h1 className={styles.title}>{isSignup ? 'Create account' : 'Log in'}</h1>

      <label className={styles.field}>
        <span>Email</span>
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
        <span>Password</span>
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
          <span>Confirm password</span>
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
          {error}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
      </button>

      <div className={styles.divider} role="separator">
        <span>or</span>
      </div>

      <button type="button" className={styles.google} onClick={handleGoogleSignIn} disabled={submitting}>
        Continue with Google
      </button>

      <p className={styles.switch}>
        {isSignup ? (
          <>
            Already have an account? <Link href="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
