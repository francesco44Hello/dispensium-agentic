import { describe, it, expect, vi, beforeEach } from 'vitest';

const fx = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  runTransaction: vi.fn(),
  deleteDoc: vi.fn(),
  writeBatch: vi.fn(),
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
  deleteDoc: fx.deleteDoc,
  documentId: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  runTransaction: fx.runTransaction,
  updateDoc: vi.fn(),
  where: vi.fn(),
  writeBatch: fx.writeBatch,
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
  fx.deleteDoc.mockReset();
});

describe('createInvite (Firestore)', () => {
  it('writes createdAt as a server timestamp so the rules can check it against request.time', async () => {
    fx.getDoc.mockResolvedValue(snapWith({ role: 'owner' }));
    const expiresAt = new Date('2026-10-29T10:00:00Z');
    await createFirestoreDataBackend().households.createInvite('hh-1', 'alice', {
      code: 'ABCD2345',
      householdId: 'hh-1',
      createdBy: 'alice',
      inviterName: 'Alice',
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

describe('shared invite link (Firestore)', () => {
  const now = new Date('2026-10-22T10:00:00Z');
  const future = { toDate: () => new Date('2099-01-01T00:00:00Z') };
  const past = { toDate: () => new Date('2020-01-01T00:00:00Z') };
  const missing: Snap = { exists: () => false, data: () => undefined };
  const invite = (overrides: Partial<Record<string, unknown>> = {}) => ({
    code: 'ABCD2345',
    householdId: 'hh-1',
    createdBy: 'alice',
    inviterName: 'Alice',
    createdAt: now,
    expiresAt: new Date('2026-10-29T10:00:00Z'),
    ...overrides,
  });

  it('refuses to create an invite for a member who is not the owner', async () => {
    fx.getDoc.mockResolvedValue(snapWith({ role: 'member' }));
    await expect(createFirestoreDataBackend().households.createInvite('hh-1', 'bob', invite({ createdBy: 'bob' }))).rejects.toMatchObject({
      code: 'not-owner',
    });
    expect(fx.setDoc).not.toHaveBeenCalled();
  });

  it('writes the inviter name on the invite', async () => {
    fx.getDoc.mockResolvedValue(snapWith({ role: 'owner' }));
    await createFirestoreDataBackend().households.createInvite('hh-1', 'alice', invite());
    const data = fx.setDoc.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(data.inviterName).toBe('Alice');
  });

  it('previews a valid invite with the code and inviter name', async () => {
    fx.getDoc.mockResolvedValue(snapWith({ householdId: 'hh-1', inviterName: 'Alice', expiresAt: future }));
    await expect(createFirestoreDataBackend().households.previewInvite('ABCD2345', now)).resolves.toEqual({
      code: 'ABCD2345',
      inviterName: 'Alice',
    });
  });

  it('refuses to preview an expired or missing invite', async () => {
    const backend = createFirestoreDataBackend().households;
    fx.getDoc.mockResolvedValueOnce(snapWith({ householdId: 'hh-1', inviterName: 'Alice', expiresAt: past }));
    await expect(backend.previewInvite('ABCD2345', now)).rejects.toMatchObject({ code: 'expired-invite' });
    fx.getDoc.mockResolvedValueOnce(missing);
    await expect(backend.previewInvite('ABCD2345', now)).rejects.toMatchObject({ code: 'invalid-invite' });
  });

  it('removes a member through the members collection when the caller is the owner', async () => {
    const batch = { delete: vi.fn(), set: vi.fn(), commit: vi.fn(async () => undefined) };
    fx.writeBatch.mockReturnValue(batch);
    // The owner (alice) is checked first, then the member being removed (bob).
    fx.getDoc.mockImplementation(async (ref: { path: string }) =>
      ref.path === 'households/hh-1/members/alice' ? snapWith({ role: 'owner' }) : snapWith({ role: 'member' }),
    );
    await createFirestoreDataBackend().households.removeMember('hh-1', 'alice', 'bob');
    expect(batch.delete).toHaveBeenCalledWith({ path: 'households/hh-1/members/bob' });
    expect(batch.set).toHaveBeenCalledWith({ path: 'households/hh-1/removed/bob' }, { removedAt: fx.serverTimestamp });
    expect(batch.commit).toHaveBeenCalled();
  });

  it('starts a new household for a user removed from their active one', async () => {
    const set = vi.fn();
    const tx: FakeTx = {
      get: async (ref) => (ref.path === 'users/alice' ? snapWith({ activeHouseholdId: 'hh-old' }) : missing),
      set,
    };
    fx.runTransaction.mockImplementation((_db: unknown, work: (t: FakeTx) => Promise<unknown>) => work(tx));

    const hid = await createFirestoreDataBackend().households.ensureDefaultHousehold('alice', 'Alice', '');
    expect(hid).not.toBe('hh-old');
    expect(set).toHaveBeenCalled();
  });

  it('keeps the active household while the user is still a member of it', async () => {
    const set = vi.fn();
    const tx: FakeTx = {
      get: async (ref) => (ref.path === 'users/alice' ? snapWith({ activeHouseholdId: 'hh-old' }) : snapWith({ role: 'member' })),
      set,
    };
    fx.runTransaction.mockImplementation((_db: unknown, work: (t: FakeTx) => Promise<unknown>) => work(tx));

    await expect(createFirestoreDataBackend().households.ensureDefaultHousehold('alice', 'Alice', '')).resolves.toBe('hh-old');
    expect(set).not.toHaveBeenCalled();
  });
});

describe('removed members and expired links (Firestore)', () => {
  const now = new Date('2026-10-22T10:00:00Z');
  const future = { toDate: () => new Date('2099-01-01T00:00:00Z') };
  const inviteData = { householdId: 'hh-1', inviterName: 'Alice', expiresAt: future };
  const missing: Snap = { exists: () => false, data: () => undefined };

  it('refuses to join with a link when the owner removed this person', async () => {
    const set = vi.fn();
    const tx: FakeTx = {
      get: async (ref) => {
        if (ref.path === 'inviteCodes/ABCD2345') return snapWith(inviteData);
        if (ref.path === 'households/hh-1/removed/bob') return snapWith({ removedAt: now });
        return missing;
      },
      set,
    };
    fx.runTransaction.mockImplementation((_db: unknown, work: (t: FakeTx) => Promise<unknown>) => work(tx));

    await expect(createFirestoreDataBackend().households.joinWithCode('bob', 'ABCD2345', now, '', '')).rejects.toMatchObject({
      code: 'removed',
    });
    expect(set).not.toHaveBeenCalled();
  });

  it('reports a link the rules refuse (expired) as not valid', async () => {
    fx.getDoc.mockRejectedValueOnce({ code: 'permission-denied' });
    await expect(createFirestoreDataBackend().households.previewInvite('ABCD2345', now)).rejects.toMatchObject({
      code: 'invalid-invite',
    });
  });
});

describe('joinWithCode refused read (Firestore)', () => {
  it('reports a link the rules refuse as not valid', async () => {
    const tx: FakeTx = {
      get: async () => {
        throw { code: 'permission-denied' };
      },
      set: vi.fn(),
    };
    fx.runTransaction.mockImplementation((_db: unknown, work: (t: FakeTx) => Promise<unknown>) => work(tx));

    await expect(
      createFirestoreDataBackend().households.joinWithCode('bob', 'ABCD2345', new Date('2026-10-22T10:00:00Z'), '', ''),
    ).rejects.toMatchObject({ code: 'invalid-invite' });
  });
});
