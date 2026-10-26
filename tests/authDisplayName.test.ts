import { describe, it, expect, vi } from 'vitest';
import { createAuthService, type AuthBackend, type AuthUser } from '../services/authService';

const fakeBackend = () => {
  const backend = {
    signUp: vi.fn(async (email: string, _password: string, displayName: string): Promise<AuthUser> => ({
      uid: 'u1',
      email,
      displayName,
      photoURL: null,
    })),
    signIn: vi.fn(async (email: string): Promise<AuthUser> => ({ uid: 'u1', email, displayName: null, photoURL: null })),
    signInWithGoogle: vi.fn(
      async (): Promise<AuthUser> => ({ uid: 'g1', email: 'g@x.co', displayName: 'Google Name', photoURL: null }),
    ),
    signOut: vi.fn(async () => {}),
    onUserChange: vi.fn(() => () => {}),
  };
  return backend as AuthBackend & typeof backend;
};

describe('authService display names', () => {
  it('passes the name typed on the sign-up form to the backend', async () => {
    const backend = fakeBackend();
    await createAuthService(backend).signUp('a@b.co', 'secret123', 'Ana Rossi');

    expect(backend.signUp).toHaveBeenCalledWith('a@b.co', 'secret123', 'Ana Rossi');
  });

  it('keeps the Google display name on the signed-in user', async () => {
    const user = await createAuthService(fakeBackend()).signInWithGoogle();

    expect(user.displayName).toBe('Google Name');
  });

  it('keeps the Google profile picture on the signed-in user', async () => {
    const backend = fakeBackend();
    backend.signInWithGoogle.mockResolvedValueOnce({ uid: 'g1', email: 'g@x.co', displayName: 'G', photoURL: 'https://lh3.googleusercontent.com/a/x' });
    const user = await createAuthService(backend).signInWithGoogle();
    expect(user.photoURL).toBe('https://lh3.googleusercontent.com/a/x');
  });

  it('rejects a sign-up without a name', async () => {
    await expect(createAuthService(fakeBackend()).signUp('a@b.co', 'secret123', '   ')).rejects.toMatchObject({
      code: 'name-required',
    });
  });
});
