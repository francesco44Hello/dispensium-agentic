import { describe, it, expect, vi } from 'vitest';
import { AuthError, createAuthService, type AuthBackend, type AuthUser } from '../services/authService';
import { createMockAuthBackend } from '../services/authBackends/mockAuthBackend';

const setup = () => createAuthService(createMockAuthBackend());

const fakeBackend = (): AuthBackend & { [K in keyof AuthBackend]: ReturnType<typeof vi.fn> } => ({
  signUp: vi.fn(async (email: string): Promise<AuthUser> => ({ uid: 'u1', email, displayName: null, photoURL: null })),
  signIn: vi.fn(async (email: string): Promise<AuthUser> => ({ uid: 'u1', email, displayName: null, photoURL: null })),
  signInWithGoogle: vi.fn(async (): Promise<AuthUser> => ({ uid: 'g1', email: 'g@x.co', displayName: null, photoURL: null })),
  signOut: vi.fn(async () => {}),
  onUserChange: vi.fn(() => () => {}),
});

describe('authService validation', () => {
  it('rejects a malformed email on sign up', async () => {
    await expect(setup().signUp('not-an-email', 'secret123')).rejects.toMatchObject({ code: 'invalid-email' });
  });

  it('rejects an empty email on sign in', async () => {
    await expect(setup().signIn('', 'secret123')).rejects.toMatchObject({ code: 'invalid-email' });
  });

  it('rejects a password shorter than 6 characters on sign up', async () => {
    await expect(setup().signUp('a@b.co', '12345')).rejects.toMatchObject({ code: 'weak-password' });
  });

  it('does not call the backend when validation fails', async () => {
    const backend = fakeBackend();
    await expect(createAuthService(backend).signUp('bad', 'secret123')).rejects.toThrow();
    expect(backend.signUp).not.toHaveBeenCalled();
  });
});

describe('authService sanitization', () => {
  it('strips blocked characters from the email and normalises it', async () => {
    const backend = fakeBackend();
    await createAuthService(backend).signUp('  <A@B.co>  ', 'secret123', 'Ana');
    expect(backend.signUp).toHaveBeenCalledWith('a@b.co', 'secret123', 'Ana');
  });

  it('passes the password through unchanged', async () => {
    const backend = fakeBackend();
    await createAuthService(backend).signIn('a@b.co', 'pa"ss<w>{rd}');
    expect(backend.signIn).toHaveBeenCalledWith('a@b.co', 'pa"ss<w>{rd}');
  });
});

describe('authService with the mock backend', () => {
  it('signs in with credentials created by sign up', async () => {
    const service = setup();
    await service.signUp('a@b.co', 'secret123', 'Ana');
    await service.signOut();
    const user = await service.signIn('a@b.co', 'secret123');
    expect(user.email).toBe('a@b.co');
  });

  it('rejects a wrong password with invalid-credentials', async () => {
    const service = setup();
    await service.signUp('a@b.co', 'secret123', 'Ana');
    await expect(service.signIn('a@b.co', 'wrong-pass')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('rejects an unknown email with invalid-credentials', async () => {
    await expect(setup().signIn('nobody@b.co', 'secret123')).rejects.toMatchObject({ code: 'invalid-credentials' });
  });

  it('rejects a duplicate sign up with email-in-use', async () => {
    const service = setup();
    await service.signUp('a@b.co', 'secret123', 'Ana');
    await expect(service.signUp('a@b.co', 'other-pass', 'Ana')).rejects.toMatchObject({ code: 'email-in-use' });
  });

  it('notifies subscribers of null, then the user on sign up, then null on sign out', async () => {
    const service = setup();
    const seen: Array<string | null> = [];
    service.onUserChange((user) => seen.push(user?.email ?? null));

    await service.signUp('a@b.co', 'secret123', 'Ana');
    await service.signOut();

    expect(seen).toEqual([null, 'a@b.co', null]);
  });

  it('stops notifying after unsubscribe', async () => {
    const service = setup();
    const listener = vi.fn();
    const unsubscribe = service.onUserChange(listener);
    unsubscribe();
    listener.mockClear();

    await service.signUp('a@b.co', 'secret123', 'Ana');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('authService Google sign-in', () => {
  it('returns the user produced by the backend', async () => {
    const backend = fakeBackend();
    const user = await createAuthService(backend).signInWithGoogle();
    expect(backend.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(user).toEqual({ uid: 'g1', email: 'g@x.co', displayName: null, photoURL: null });
  });

  it('propagates a popup-closed error from the backend', async () => {
    const backend = fakeBackend();
    vi.mocked(backend.signInWithGoogle).mockRejectedValueOnce(new AuthError('popup-closed'));
    await expect(createAuthService(backend).signInWithGoogle()).rejects.toMatchObject({ code: 'popup-closed' });
  });

  it('signs in the mock Google account and notifies subscribers', async () => {
    const service = setup();
    const seen: Array<string | null> = [];
    service.onUserChange((user) => seen.push(user?.email ?? null));

    await service.signInWithGoogle();

    expect(seen).toEqual([null, 'google.user@example.com']);
  });
});
