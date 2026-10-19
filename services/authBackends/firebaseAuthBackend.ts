import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { AuthError, type AuthBackend, type AuthErrorCode, type AuthUser } from '../authService';
import { getFirebaseApp } from '../firebaseApp';

const FIREBASE_ERROR_MAP: Record<string, AuthErrorCode> = {
  'auth/invalid-email': 'invalid-email',
  'auth/weak-password': 'weak-password',
  'auth/email-already-in-use': 'email-in-use',
  'auth/invalid-credential': 'invalid-credentials',
  'auth/invalid-login-credentials': 'invalid-credentials',
  'auth/user-not-found': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/account-exists-with-different-credential': 'email-in-use',
  'auth/popup-closed-by-user': 'popup-closed',
  'auth/cancelled-popup-request': 'popup-closed',
};

function toAuthError(error: unknown): AuthError {
  const code = (error as { code?: string })?.code ?? '';
  return new AuthError(FIREBASE_ERROR_MAP[code] ?? 'unknown');
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email };
}

// Firebase Auth is resolved lazily so importing this module on the server is safe.
export function createFirebaseAuthBackend(): AuthBackend {
  const auth = () => getAuth(getFirebaseApp());

  return {
    async signUp(email, password) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth(), email, password);
        return toAuthUser(user);
      } catch (error) {
        throw toAuthError(error);
      }
    },

    async signIn(email, password) {
      try {
        const { user } = await signInWithEmailAndPassword(auth(), email, password);
        return toAuthUser(user);
      } catch (error) {
        throw toAuthError(error);
      }
    },

    async signInWithGoogle() {
      try {
        const { user } = await signInWithPopup(auth(), new GoogleAuthProvider());
        return toAuthUser(user);
      } catch (error) {
        throw toAuthError(error);
      }
    },

    async signOut() {
      await firebaseSignOut(auth());
    },

    onUserChange(listener) {
      return onAuthStateChanged(auth(), (user) => listener(user ? toAuthUser(user) : null));
    },
  };
}
