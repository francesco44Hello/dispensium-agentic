import { describe, it, expect, vi, beforeEach } from 'vitest';

const fx = vi.hoisted(() => ({
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: () => ({}),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: fx.onSnapshot,
  orderBy: vi.fn(),
  query: vi.fn(),
  runTransaction: fx.runTransaction,
  updateDoc: fx.updateDoc,
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

beforeEach(() => {
  fx.updateDoc.mockReset();
  fx.onSnapshot.mockReset();
  fx.runTransaction.mockReset();
});

describe('firestore member names', () => {
  it('writes the display name to the member document only', async () => {
    fx.updateDoc.mockResolvedValue(undefined);
    await createFirestoreDataBackend().households.saveMemberName('hh-1', 'alice', 'Alice');

    expect(fx.updateDoc).toHaveBeenCalledWith({ path: 'households/hh-1/members/alice' }, { displayName: 'Alice' });
  });

  it('reads saved names and leaves the name off members who have none', async () => {
    fx.onSnapshot.mockImplementation((_ref: unknown, listener: (snap: unknown) => void) => {
      listener({
        docs: [
          { id: 'alice', data: () => ({ role: 'owner', joinedAt: new Date(0), displayName: 'Alice' }) },
          { id: 'bob', data: () => ({ role: 'member', joinedAt: new Date(1) }) },
        ],
      });
      return () => {};
    });

    let members: { uid: string; displayName?: string }[] = [];
    createFirestoreDataBackend().households.subscribeToMembers('hh-1', (list) => {
      members = list;
    });

    expect(members.find((m) => m.uid === 'alice')?.displayName).toBe('Alice');
    expect(members.find((m) => m.uid === 'bob')).not.toHaveProperty('displayName');
  });

  it('saves the picture for a member when it is given', async () => {
    fx.updateDoc.mockResolvedValue(undefined);
    await createFirestoreDataBackend().households.saveMemberPhoto('hh-1', 'alice', 'https://lh3.googleusercontent.com/a/x');

    expect(fx.updateDoc).toHaveBeenCalledWith({ path: 'households/hh-1/members/alice' }, { photoUrl: 'https://lh3.googleusercontent.com/a/x' });
  });

  it('reads a saved picture and omits it for members without one', async () => {
    fx.onSnapshot.mockImplementation((_ref: unknown, listener: (snap: unknown) => void) => {
      listener({
        docs: [
          { id: 'alice', data: () => ({ role: 'owner', joinedAt: new Date(0), photoUrl: 'https://lh3.googleusercontent.com/a/x' }) },
          { id: 'bob', data: () => ({ role: 'member', joinedAt: new Date(1) }) },
        ],
      });
      return () => {};
    });

    let members: { uid: string; photoUrl?: string }[] = [];
    createFirestoreDataBackend().households.subscribeToMembers('hh-1', (list) => {
      members = list;
    });

    expect(members.find((m) => m.uid === 'alice')?.photoUrl).toBe('https://lh3.googleusercontent.com/a/x');
    expect(members.find((m) => m.uid === 'bob')).not.toHaveProperty('photoUrl');
  });

  it('stores the owner name when the household is created', async () => {
    const set = vi.fn();
    fx.runTransaction.mockImplementation(async (_db: unknown, work: (tx: unknown) => Promise<unknown>) =>
      work({ get: async () => ({ data: () => undefined }), set }),
    );

    await createFirestoreDataBackend().households.ensureDefaultHousehold('alice', 'Alice', '');

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringMatching(/members\/alice$/) }),
      expect.objectContaining({ role: 'owner', displayName: 'Alice' }),
    );
  });
});
