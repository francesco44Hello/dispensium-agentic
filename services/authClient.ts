import { createAuthService } from './authService';
import { createFirebaseAuthBackend } from './authBackends/firebaseAuthBackend';
import { createMockAuthBackend } from './authBackends/mockAuthBackend';

// Mock mode is opt-in via NEXT_PUBLIC_AUTH_MOCK, and is also used when no Firebase key is configured.
export const isMockAuth =
  process.env.NEXT_PUBLIC_AUTH_MOCK === 'true' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const authService = createAuthService(
  isMockAuth ? createMockAuthBackend() : createFirebaseAuthBackend(),
);
