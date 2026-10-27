import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { AuthError, type AuthBackend, type AuthErrorCode, type AuthUser } from '../authService';
import { getFirebaseApp } from '../firebaseApp';
import { hasCode } from '../../utils/hasCode';
import { createGoogleProvider } from './googleProvider';

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
  const code = hasCode(error) ? error.code : '';
  return new AuthError(FIREBASE_ERROR_MAP[code] ?? 'unknown');
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
}

// Firebase Auth is resolved lazily so importing this module on the server is safe.
export function createFirebaseAuthBackend(): AuthBackend {
  const auth = () => getAuth(getFirebaseApp());

  return {
    async signUp(email, password, displayName) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth(), email, password);
        await updateProfile(user, { displayName });
        return toAuthUser(user);
      } catch (error) {
        throw toAuthError(error);
      }
    },

    async updateDisplayName(displayName) {
      const user = auth().currentUser;
      if (!user) throw new AuthError('unknown');
      try {
        await updateProfile(user, { displayName });
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
        const { user } = await signInWithPopup(auth(), createGoogleProvider());
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
