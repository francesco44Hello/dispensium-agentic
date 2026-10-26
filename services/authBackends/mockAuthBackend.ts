import { AuthError, type AuthBackend, type AuthUser } from '../authService';

type StoredUser = AuthUser & { password: string | null };

const MOCK_GOOGLE_EMAIL = 'google.user@example.com';
const MOCK_GOOGLE_NAME = 'Mock Google User';

export function createMockAuthBackend(): AuthBackend {
  const users = new Map<string, StoredUser>();
  const listeners = new Set<(user: AuthUser | null) => void>();
  let current: AuthUser | null = null;
  let nextId = 1;

  const setCurrent = (user: AuthUser | null) => {
    current = user;
    listeners.forEach((listener) => listener(current));
  };

  return {
    async signUp(email, password, displayName) {
      if (users.has(email)) throw new AuthError('email-in-use');
      const user: StoredUser = { uid: `mock-${nextId++}`, email, password, displayName, photoURL: null };
      users.set(email, user);
      setCurrent({ uid: user.uid, email, displayName, photoURL: null });
      return { uid: user.uid, email, displayName, photoURL: null };
    },

    async signIn(email, password) {
      const user = users.get(email);
      if (!user || user.password === null || user.password !== password) {
        throw new AuthError('invalid-credentials');
      }
      const signedIn: AuthUser = { uid: user.uid, email, displayName: user.displayName, photoURL: null };
      setCurrent(signedIn);
      return signedIn;
    },

    async signInWithGoogle() {
      // Mirrors Firebase: the first Google sign-in creates the account, later ones reuse it.
      let user = users.get(MOCK_GOOGLE_EMAIL);
      if (!user) {
        user = { uid: `mock-${nextId++}`, email: MOCK_GOOGLE_EMAIL, password: null, displayName: MOCK_GOOGLE_NAME, photoURL: null };
        users.set(MOCK_GOOGLE_EMAIL, user);
      }
      const signedIn: AuthUser = { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: null };
      setCurrent(signedIn);
      return signedIn;
    },

    async signOut() {
      setCurrent(null);
    },

    onUserChange(listener) {
      listeners.add(listener);
      listener(current);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
