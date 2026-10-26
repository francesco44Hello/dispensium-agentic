import { describe, it, expect, vi, beforeEach } from 'vitest';

const fx = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: { __sentinel: 'server-timestamp' },
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDoc: fx.getDoc,
  setDoc: fx.setDoc,
  serverTimestamp: () => fx.serverTimestamp,
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  runTransaction: fx.runTransaction,
  updateDoc: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));
vi.mock('firebase/storage', () => ({
  deleteObject: vi.fn(),
  getBytes: vi.fn(),
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));
vi.mock('../services/firebaseApp', () => ({ getFirebaseApp: () => ({}) }));

import { createFirestoreDataBackend } from '../services/dataBackends/firestoreDataBackend';

type Snap = { exists: () => boolean; data: () => unknown };
const snapWith = (data: unknown): Snap => ({ exists: () => true, data: () => data });

beforeEach(() => {
  fx.getDoc.mockReset();
  fx.setDoc.mockReset();
  fx.runTransaction.mockReset();
});

describe('createInvite (Firestore)', () => {
  it('writes createdAt as a server timestamp so the rules can check it against request.time', async () => {
    fx.getDoc.mockResolvedValue(snapWith({}));
    const expiresAt = new Date('2026-10-29T10:00:00Z');
    await createFirestoreDataBackend().households.createInvite('hh-1', 'alice', {
      code: 'ABCD2345',
      householdId: 'hh-1',
      createdBy: 'alice',
      createdAt: new Date('2026-10-22T10:00:00Z'),
      expiresAt,
    });

    expect(fx.setDoc).toHaveBeenCalledTimes(1);
    const data = fx.setDoc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(data.createdAt).toBe(fx.serverTimestamp);
    expect(data).toMatchObject({ householdId: 'hh-1', createdBy: 'alice', expiresAt });
  });
});

describe('getCategoryMap (Firestore)', () => {
  it('returns a well-formed map', async () => {
    fx.getDoc.mockResolvedValue(snapWith({ map: { fruits: ['apple'] } }));
    expect(await createFirestoreDataBackend().groceries.getCategoryMap('hh-1')).toEqual({ fruits: ['apple'] });
  });

  it('treats a malformed stored map as missing instead of trusting it', async () => {
    fx.getDoc.mockResolvedValue(snapWith({ map: { fruits: 'apple' } }));
    expect(await createFirestoreDataBackend().groceries.getCategoryMap('hh-1')).toBeNull();
  });
});

type FakeTx = {
  get: (ref: { path: string }) => Promise<Snap>;
  set: (...args: unknown[]) => void;
};

describe('joinWithCode (Firestore)', () => {
  const now = new Date('2026-10-22T10:00:00Z');
  // Firestore timestamps expose toDate(); the backend reads expiry through it.
  const future = { toDate: () => new Date('2099-01-01T00:00:00Z') };
  const missing: Snap = { exists: () => false, data: () => undefined };

  it('refuses an invite with no householdId instead of joining a household called "undefined"', async () => {
    const set = vi.fn();
    const tx: FakeTx = {
      get: async (ref) =>
        ref.path.startsWith('inviteCodes/')
          ? snapWith({ expiresAt: future })
          : missing,
      set,
    };
    fx.runTransaction.mockImplementation((_db: unknown, work: (t: FakeTx) => Promise<unknown>) => work(tx));

    await expect(createFirestoreDataBackend().households.joinWithCode('bob', 'ABCD2345', now, '', '')).rejects.toMatchObject({
      code: 'invalid-invite',
    });
    expect(set).not.toHaveBeenCalled();
  });

  it('refuses an invite whose householdId is not a string', async () => {
    const tx: FakeTx = {
      get: async (ref) =>
        ref.path.startsWith('inviteCodes/')
          ? snapWith({ householdId: { id: 'hh-1' }, expiresAt: future })
          : missing,
      set: vi.fn(),
    };
    fx.runTransaction.mockImplementation((_db: unknown, work: (t: FakeTx) => Promise<unknown>) => work(tx));

    await expect(createFirestoreDataBackend().households.joinWithCode('bob', 'ABCD2345', now, '', '')).rejects.toMatchObject({
      code: 'invalid-invite',
    });
  });
});
