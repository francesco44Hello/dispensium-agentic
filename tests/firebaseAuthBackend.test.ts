import { describe, it, expect, vi, beforeEach } from 'vitest';

const fx = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock('firebase/auth', () => {
  class GoogleAuthProvider {
    setCustomParameters() {}
  }
  return {
    GoogleAuthProvider,
    createUserWithEmailAndPassword: fx.createUserWithEmailAndPassword,
    getAuth: () => ({}),
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signInWithPopup: fx.signInWithPopup,
    signOut: vi.fn(),
    updateProfile: fx.updateProfile,
  };
});
vi.mock('../services/firebaseApp', () => ({ getFirebaseApp: () => ({}) }));

import { createFirebaseAuthBackend } from '../services/authBackends/firebaseAuthBackend';

beforeEach(() => {
  fx.createUserWithEmailAndPassword.mockReset();
  fx.updateProfile.mockReset();
  fx.signInWithPopup.mockReset();
});

describe('firebase sign-up display name', () => {
  it('saves the typed name on the new Firebase user', async () => {
    const user = { uid: 'u1', email: 'ana@example.com', displayName: null as string | null, photoURL: null as string | null };
    fx.createUserWithEmailAndPassword.mockResolvedValue({ user });
    fx.updateProfile.mockImplementation(async (target: typeof user, profile: { displayName: string }) => {
      target.displayName = profile.displayName;
    });

    const result = await createFirebaseAuthBackend().signUp('ana@example.com', 'secret123', 'Ana Rossi');

    expect(fx.updateProfile).toHaveBeenCalledWith(user, { displayName: 'Ana Rossi' });
    expect(result).toEqual({ uid: 'u1', email: 'ana@example.com', displayName: 'Ana Rossi', photoURL: null });
  });
});

describe('firebase Google sign-in photo', () => {
  it('returns the Google profile picture with the signed-in user', async () => {
    fx.signInWithPopup.mockResolvedValue({
      user: { uid: 'g1', email: 'g@x.co', displayName: 'G', photoURL: 'https://lh3.googleusercontent.com/a/x' },
    });

    const result = await createFirebaseAuthBackend().signInWithGoogle();

    expect(result.photoURL).toBe('https://lh3.googleusercontent.com/a/x');
  });
});
