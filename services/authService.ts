import { sanitizeInput } from '../utils/sanitizeInput';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthUser = {
  uid: string;
  email: string | null;
};

export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'email-in-use'
  | 'invalid-credentials'
  | 'popup-closed'
  | 'unknown';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface AuthBackend {
  signUp(email: string, password: string): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
  onUserChange(listener: (user: AuthUser | null) => void): () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function normalizeEmail(email: unknown): string {
  const clean = sanitizeInput(email).trim().toLowerCase();
  if (!EMAIL_PATTERN.test(clean)) throw new AuthError('invalid-email');
  return clean;
}

export function createAuthService(backend: AuthBackend) {
  return {
    async signUp(email: string, password: string): Promise<AuthUser> {
      const cleanEmail = normalizeEmail(email);
      if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new AuthError('weak-password');
      }
      return backend.signUp(cleanEmail, password);
    },

    async signIn(email: string, password: string): Promise<AuthUser> {
      const cleanEmail = normalizeEmail(email);
      return backend.signIn(cleanEmail, password);
    },

    signInWithGoogle(): Promise<AuthUser> {
      return backend.signInWithGoogle();
    },

    signOut(): Promise<void> {
      return backend.signOut();
    },

    onUserChange(listener: (user: AuthUser | null) => void): () => void {
      return backend.onUserChange(listener);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
