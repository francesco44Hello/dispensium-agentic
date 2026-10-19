import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

// Runs against the Firestore emulator: `npm run test:rules` (needs Java).
// FIRESTORE_EMULATOR_HOST is provided by `firebase emulators:exec`.

const HID = 'hh-1';
const OTHER_HID = 'hh-2';
const DAY_MS = 24 * 60 * 60 * 1000;

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dispensium',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// alice owns hh-1 (one grocery, a category map, a valid and an expired invite).
// dave owns hh-2 so cross-household access can be tested.
async function seed() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const now = new Date();
    await setDoc(doc(db, 'households', HID), { name: 'My household', ownerUid: 'alice', createdAt: now });
    await setDoc(doc(db, 'households', HID, 'members', 'alice'), { role: 'owner', joinedAt: now });
    await setDoc(doc(db, 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: ['apple'] } });
    await setDoc(doc(db, 'households', HID, 'groceries', 'g1'), {
      name: 'Milk',
      category: 'dairy',
      completed: false,
      createdAt: now,
      createdBy: 'alice',
    });
    await setDoc(doc(db, 'inviteCodes', 'VALID234'), {
      householdId: HID,
      createdBy: 'alice',
      createdAt: now,
      expiresAt: new Date(now.getTime() + DAY_MS),
    });
    await setDoc(doc(db, 'inviteCodes', 'EXPIRED2'), {
      householdId: HID,
      createdBy: 'alice',
      createdAt: new Date(now.getTime() - 2 * DAY_MS),
      expiresAt: new Date(now.getTime() - DAY_MS),
    });
    await setDoc(doc(db, 'households', OTHER_HID), { name: 'Other', ownerUid: 'dave', createdAt: now });
    await setDoc(doc(db, 'households', OTHER_HID, 'members', 'dave'), { role: 'owner', joinedAt: now });
    await setDoc(doc(db, 'households', OTHER_HID, 'groceries', 'x1'), {
      name: 'Secret',
      category: 'other',
      completed: false,
      createdAt: now,
      createdBy: 'dave',
    });
    await setDoc(doc(db, 'inviteCodes', 'OTHER222'), {
      householdId: OTHER_HID,
      createdBy: 'dave',
      createdAt: now,
      expiresAt: new Date(now.getTime() + DAY_MS),
    });
  });
}

const newGrocery = (name: string) => ({
  name,
  category: 'other',
  completed: false,
  createdAt: new Date(),
  createdBy: 'alice',
});

describe('unauthenticated access', () => {
  it('cannot read anything', async () => {
    await assertFails(getDoc(doc(anon(), 'households', HID)));
    await assertFails(getDocs(collection(anon(), 'households', HID, 'groceries')));
    await assertFails(getDoc(doc(anon(), 'inviteCodes', 'VALID234')));
  });
});

describe('users', () => {
  it('can read and write their own document only', async () => {
    await assertSucceeds(setDoc(doc(as('carol'), 'users', 'carol'), { activeHouseholdId: HID }));
    await assertSucceeds(getDoc(doc(as('carol'), 'users', 'carol')));
    await assertFails(getDoc(doc(as('carol'), 'users', 'alice')));
    await assertFails(setDoc(doc(as('carol'), 'users', 'alice'), { activeHouseholdId: HID }));
  });
});

describe('household bootstrap', () => {
  it('lets a user create their own household, owner membership and category map in one batch', async () => {
    const db = as('carol');
    const batch = writeBatch(db);
    batch.set(doc(db, 'households', 'hh-new'), { name: 'My household', ownerUid: 'carol', createdAt: new Date() });
    batch.set(doc(db, 'households', 'hh-new', 'members', 'carol'), { role: 'owner', joinedAt: new Date() });
    batch.set(doc(db, 'households', 'hh-new', 'configuration', 'categoryMap'), { map: { fruits: [] } });
    batch.set(doc(db, 'users', 'carol'), { activeHouseholdId: 'hh-new' }, { merge: true });
    await assertSucceeds(batch.commit());
  });

  it('rejects a household owned by someone else', async () => {
    await assertFails(
      setDoc(doc(as('carol'), 'households', 'hh-new'), { name: 'Mine', ownerUid: 'alice', createdAt: new Date() }),
    );
  });

  it('rejects a household name containing blocked characters', async () => {
    await assertFails(
      setDoc(doc(as('carol'), 'households', 'hh-new'), { name: '<script>', ownerUid: 'carol', createdAt: new Date() }),
    );
  });

  it('rejects claiming owner membership of an existing household', async () => {
    await assertFails(
      setDoc(doc(as('carol'), 'households', HID, 'members', 'carol'), { role: 'owner', joinedAt: new Date() }),
    );
  });

  it('rejects creating a category map for an existing household as a non-member', async () => {
    await assertFails(
      setDoc(doc(as('carol'), 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: [] } }),
    );
  });
});

describe('household isolation', () => {
  it('lets a member read their household, groceries and member list', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'households', HID)));
    await assertSucceeds(getDocs(collection(as('alice'), 'households', HID, 'groceries')));
    await assertSucceeds(getDocs(collection(as('alice'), 'households', HID, 'members')));
  });

  it('denies a non-member', async () => {
    await assertFails(getDoc(doc(as('bob'), 'households', HID)));
    await assertFails(getDocs(collection(as('bob'), 'households', HID, 'groceries')));
    await assertFails(getDocs(collection(as('bob'), 'households', HID, 'members')));
  });

  it('denies a member of another household', async () => {
    await assertFails(getDocs(collection(as('alice'), 'households', OTHER_HID, 'groceries')));
    await assertFails(getDoc(doc(as('dave'), 'households', HID)));
  });
});

describe('groceries', () => {
  it('lets a member add, complete and rename an item', async () => {
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'households', HID, 'groceries', 'g2'), newGrocery('Bread')));
    await assertSucceeds(updateDoc(doc(db, 'households', HID, 'groceries', 'g1'), { completed: true }));
    await assertSucceeds(updateDoc(doc(db, 'households', HID, 'groceries', 'g1'), { name: 'Oat milk' }));
  });

  it('rejects names with blocked characters, empty names and non-boolean completed', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'households', HID, 'groceries', 'g3'), newGrocery('<b>x</b>')));
    await assertFails(setDoc(doc(db, 'households', HID, 'groceries', 'g3'), newGrocery('')));
    await assertFails(setDoc(doc(db, 'households', HID, 'groceries', 'g3'), { ...newGrocery('Ok'), completed: 'yes' }));
  });

  it('rejects names longer than 100 characters', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'groceries', 'g3'), newGrocery('a'.repeat(101))));
  });

  it('denies writes from a non-member', async () => {
    await assertFails(setDoc(doc(as('bob'), 'households', HID, 'groceries', 'g4'), newGrocery('Hack')));
    await assertFails(updateDoc(doc(as('bob'), 'households', HID, 'groceries', 'g1'), { completed: true }));
  });
});

describe('category map', () => {
  it('lets a member update the map', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: ['apple', 'kiwi'] } }),
    );
  });

  it('rejects extra fields and other document ids', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'households', HID, 'configuration', 'categoryMap'), { map: {}, extra: 1 }));
    await assertFails(setDoc(doc(db, 'households', HID, 'configuration', 'other'), { map: {} }));
  });

  it('denies a non-member update', async () => {
    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: [] } }),
    );
  });
});

describe('invite codes and joining', () => {
  it('lets a signed-in user read a code they know, but never list codes', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'inviteCodes', 'VALID234')));
    await assertFails(getDocs(collection(as('bob'), 'inviteCodes')));
  });

  it('lets a member create an invite for their household, and not for another', async () => {
    const invite = (householdId: string) => ({
      householdId,
      createdBy: 'alice',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    await assertSucceeds(setDoc(doc(as('alice'), 'inviteCodes', 'NEWCODE2'), invite(HID)));
    await assertFails(setDoc(doc(as('alice'), 'inviteCodes', 'NEWCODE3'), invite(OTHER_HID)));
    await assertFails(setDoc(doc(as('bob'), 'inviteCodes', 'NEWCODE4'), { ...invite(HID), createdBy: 'bob' }));
  });

  it('lets a user read their own (missing) membership before joining', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'households', HID, 'members', 'bob')));
  });

  it('lets a user join with a valid code, then read the household', async () => {
    const db = as('bob');
    await assertSucceeds(
      setDoc(doc(db, 'households', HID, 'members', 'bob'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'VALID234',
      }),
    );
    await assertSucceeds(getDocs(collection(db, 'households', HID, 'groceries')));
  });

  it('rejects joining with an expired code', async () => {
    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'members', 'bob'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'EXPIRED2',
      }),
    );
  });

  it('rejects joining with a code for a different household', async () => {
    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'members', 'bob'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'OTHER222',
      }),
    );
  });

  it('rejects joining as owner, or on behalf of another user', async () => {
    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'members', 'bob'), {
        role: 'owner',
        joinedAt: new Date(),
        inviteCode: 'VALID234',
      }),
    );
    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'members', 'erin'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'VALID234',
      }),
    );
  });

  it('rejects joining without a code', async () => {
    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'members', 'bob'), { role: 'member', joinedAt: new Date() }),
    );
  });

  it('does not let members be edited or removed afterwards', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'households', HID, 'members', 'alice'), { role: 'member' }));
  });
});
