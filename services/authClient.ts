import { getAuth } from 'firebase/auth';
import { createAuthService } from './authService';
import { getFirebaseApp } from './firebaseApp';
import { createFirebaseAuthBackend } from './authBackends/firebaseAuthBackend';
import { createMockAuthBackend } from './authBackends/mockAuthBackend';

type AuthMode = 'mock' | 'firebase';

interface AuthModeEnv {
  mockFlag: string | undefined;
  apiKey: string | undefined;
  nodeEnv: string | undefined;
}

// Mock mode is opt-in only (NEXT_PUBLIC_AUTH_MOCK=true) and never allowed in a production build: a production
// build that accepts fake accounts must fail at startup. A missing Firebase key never switches to mock:
// in a production build it is a misconfiguration, so the app fails at startup instead of serving fake accounts.
export function resolveAuthMode(env: AuthModeEnv): AuthMode {
  if (env.mockFlag === 'true') {
    if (env.nodeEnv === 'production') {
      throw new Error(
        'NEXT_PUBLIC_AUTH_MOCK=true is not allowed in a production build. Mock accounts must never run for real users; unset it.',
      );
    }
    return 'mock';
  }
  if (env.nodeEnv === 'production' && !env.apiKey) {
    throw new Error(
      'NEXT_PUBLIC_FIREBASE_API_KEY is missing in this production build. Set it before building.',
    );
  }
  return 'firebase';
}

const authMode = resolveAuthMode({
  mockFlag: process.env.NEXT_PUBLIC_AUTH_MOCK,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  nodeEnv: process.env.NODE_ENV,
});
export const isMockAuth = authMode === 'mock';

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
