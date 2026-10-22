import { getAuth } from 'firebase/auth';
import { createAuthService } from './authService';
import { getFirebaseApp } from './firebaseApp';
import { createFirebaseAuthBackend } from './authBackends/firebaseAuthBackend';
import { createMockAuthBackend } from './authBackends/mockAuthBackend';

// Mock mode is opt-in via NEXT_PUBLIC_AUTH_MOCK, and is also used when no Firebase key is configured.
export const isMockAuth =
  process.env.NEXT_PUBLIC_AUTH_MOCK === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const authService = createAuthService(
  isMockAuth ? createMockAuthBackend() : createFirebaseAuthBackend(),
);

// The signed-in user's ID token, sent to our routes so the server can check who is asking.
export async function currentIdToken(): Promise<string> {
  if (isMockAuth) return 'mock-token';
  const user = getAuth(getFirebaseApp()).currentUser;
  if (!user) throw new Error('Sign in to import recipes.');
  return user.getIdToken();
}
