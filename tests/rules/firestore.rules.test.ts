import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

// Runs against the Firestore emulator: `npm run test:rules` (needs Java).
// FIRESTORE_EMULATOR_HOST is provided by `firebase emulators:exec`.

const HID = 'hh-1';
const OTHER_HID = 'hh-2';
const MIN_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MIN_MS;

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
      inviterName: 'Alice',
      createdAt: now,
      expiresAt: new Date(now.getTime() + DAY_MS),
    });
    await setDoc(doc(db, 'inviteCodes', 'EXPIRED2'), {
      householdId: HID,
      createdBy: 'alice',
      inviterName: 'Alice',
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
      inviterName: 'Dave',
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

  it('refuses a forged createdBy on create', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'groceries', 'g5'), { ...newGrocery('Eggs'), createdBy: 'bob' }));
  });

  it('refuses keys other than name, category, completed, createdBy and createdAt, on create and update', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'households', HID, 'groceries', 'g5'), { ...newGrocery('Eggs'), priority: 1 }));
    await assertFails(updateDoc(doc(db, 'households', HID, 'groceries', 'g1'), { completed: true, createdBy: 'bob' }));
    await assertFails(updateDoc(doc(db, 'households', HID, 'groceries', 'g1'), { completed: true, note: 'x' }));
  });

  it('rejects a category with blocked characters or over 100 characters', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'households', HID, 'groceries', 'g5'), { ...newGrocery('Eggs'), category: '<b>' }));
    await assertFails(setDoc(doc(db, 'households', HID, 'groceries', 'g5'), { ...newGrocery('Eggs'), category: 'c'.repeat(101) }));
    await assertFails(updateDoc(doc(db, 'households', HID, 'groceries', 'g1'), { category: '' }));
  });

  it('denies writes from a non-member', async () => {
    await assertFails(setDoc(doc(as('bob'), 'households', HID, 'groceries', 'g4'), newGrocery('Hack')));
    await assertFails(updateDoc(doc(as('bob'), 'households', HID, 'groceries', 'g1'), { completed: true }));
  });
});

describe('category map', () => {
  // The category map is written once, at household creation. There is no UI to edit it any more.
  it('refuses a member update of the map', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: ['apple', 'kiwi'] } }),
    );
    await assertFails(
      updateDoc(doc(as('alice'), 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: ['apple', 'kiwi'] } }),
    );
  });

  it('refuses an owner update of the map, and still lets members read it', async () => {
    await assertFails(
      updateDoc(doc(as('alice'), 'households', HID, 'configuration', 'categoryMap'), { map: { fruits: [] } }),
    );
    await assertSucceeds(getDoc(doc(as('alice'), 'households', HID, 'configuration', 'categoryMap')));
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
      inviterName: 'Alice',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    await assertSucceeds(setDoc(doc(as('alice'), 'inviteCodes', 'FRESHCD2'), invite(HID)));
    await assertFails(setDoc(doc(as('alice'), 'inviteCodes', 'FRESHCD3'), invite(OTHER_HID)));
    await assertFails(setDoc(doc(as('bob'), 'inviteCodes', 'FRESHCD4'), { ...invite(HID), createdBy: 'bob' }));
  });

  it('refuses an invite with a field the client never writes', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'inviteCodes', 'EXTRA234'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + DAY_MS),
        note: 'smuggled',
      }),
    );
  });

  it('refuses an invite whose code id is malformed', async () => {
    const invite = () => ({
      householdId: HID,
      createdBy: 'alice',
      inviterName: 'Alice',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + DAY_MS),
    });
    // Too short, too long, a zero (not in the alphabet), and lowercase.
    for (const code of ['SHORT23', 'LONGCODE9', 'ZERO0000', 'lower234']) {
      await assertFails(setDoc(doc(as('alice'), 'inviteCodes', code), invite()));
    }
  });

  it('accepts a valid invite that expires within 7 days', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), 'inviteCodes', 'WEEK2345'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * DAY_MS),
      }),
    );
  });

  it('refuses an invite that expires in 30 days', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'inviteCodes', 'LONG2345'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * DAY_MS),
      }),
    );
  });

  it('refuses a signed-out user an invite code, even one they know', async () => {
    await assertFails(getDoc(doc(anon(), 'inviteCodes', 'VALID234')));
  });

  it('accepts an invite that expires exactly 7 days ahead', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), 'inviteCodes', 'EXACT234'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * DAY_MS),
      }),
    );
  });

  it('accepts an invite 7 days and 2 minutes ahead, so a device clock slightly ahead is tolerated', async () => {
    await assertSucceeds(
      setDoc(doc(as('alice'), 'inviteCodes', 'SKEW2345'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * DAY_MS + 2 * MIN_MS),
      }),
    );
  });

  it('refuses an invite 7 days and 1 hour ahead, beyond the 5 minute skew allowance', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'inviteCodes', 'HOUR2345'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * DAY_MS + 60 * MIN_MS),
      }),
    );
  });

  it('refuses an invite with a backdated createdAt', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'inviteCodes', 'BACK2345'), {
        householdId: HID,
        createdBy: 'alice',
        inviterName: 'Alice',
        createdAt: new Date(Date.now() - 2 * DAY_MS),
        expiresAt: new Date(Date.now() + DAY_MS),
      }),
    );
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

describe('recipes', () => {
  const validRecipe = (overrides: Record<string, unknown> = {}) => ({
    title: 'Soup',
    time: '20 min',
    category: 'Dinner',
    label: 'Quick & Easy ⚡',
    ingredients: ['water'],
    steps: ['Boil'],
    image: '',
    createdAt: new Date(),
    createdBy: 'alice',
    ...overrides,
  });

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'households', HID, 'recipes', 'r1'), { ...validRecipe(), title: 'Existing' });
      await setDoc(doc(db, 'households', OTHER_HID, 'recipes', 'x1'), { ...validRecipe(), createdBy: 'dave' });
    });
  });

  it('lets a member create a valid recipe for their household', async () => {
    await assertSucceeds(addDoc(collection(as('alice'), 'households', HID, 'recipes'), validRecipe()));
  });

  it('lets a member read and delete their household recipes', async () => {
    await assertSucceeds(getDoc(doc(as('alice'), 'households', HID, 'recipes', 'r1')));
    await assertSucceeds(getDocs(collection(as('alice'), 'households', HID, 'recipes')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'households', HID, 'recipes', 'r1')));
  });

  it('blocks non-members from creating, reading and deleting recipes', async () => {
    await assertFails(addDoc(collection(as('bob'), 'households', HID, 'recipes'), validRecipe({ createdBy: 'bob' })));
    await assertFails(getDocs(collection(as('bob'), 'households', HID, 'recipes')));
    await assertFails(deleteDoc(doc(as('bob'), 'households', HID, 'recipes', 'r1')));
    await assertFails(getDoc(doc(as('alice'), 'households', OTHER_HID, 'recipes', 'x1')));
  });

  it('requires createdBy to be the signed-in user', async () => {
    await assertFails(addDoc(collection(as('alice'), 'households', HID, 'recipes'), validRecipe({ createdBy: 'bob' })));
  });

  it('rejects an unknown category or label', async () => {
    const recipes = collection(as('alice'), 'households', HID, 'recipes');
    await assertFails(addDoc(recipes, validRecipe({ category: 'Brunch' })));
    await assertFails(addDoc(recipes, validRecipe({ label: 'Spicy' })));
  });

  it('rejects markup in the time field', async () => {
    await assertFails(addDoc(collection(as('alice'), 'households', HID, 'recipes'), validRecipe({ time: '<b>20</b>' })));
  });

  it('rejects an empty, too long or markup title', async () => {
    const recipes = collection(as('alice'), 'households', HID, 'recipes');
    await assertFails(addDoc(recipes, validRecipe({ title: '' })));
    await assertFails(addDoc(recipes, validRecipe({ title: 'x'.repeat(101) })));
    await assertFails(addDoc(recipes, validRecipe({ title: '<script>' })));
  });

  it('rejects too many ingredients or steps', async () => {
    const recipes = collection(as('alice'), 'households', HID, 'recipes');
    const many = Array.from({ length: 51 }, (_, i) => `item ${i}`);
    await assertFails(addDoc(recipes, validRecipe({ ingredients: many })));
    await assertFails(addDoc(recipes, validRecipe({ steps: many })));
  });

  it('accepts only empty images or photos stored in the member household', async () => {
    const recipes = collection(as('alice'), 'households', HID, 'recipes');
    await assertSucceeds(addDoc(recipes, validRecipe({ image: '' })));
    await assertSucceeds(addDoc(recipes, validRecipe({ image: `households/${HID}/recipes/0f3a-photo.webp` })));
    await assertFails(addDoc(recipes, validRecipe({ image: 'https://example.com/a.jpg' })));
    await assertFails(addDoc(recipes, validRecipe({ image: `households/${OTHER_HID}/recipes/x.webp` })));
    await assertFails(addDoc(recipes, validRecipe({ image: `households/${HID}/recipes/x.html` })));
  });

  it('rejects extra fields and a client-supplied non-timestamp createdAt', async () => {
    const recipes = collection(as('alice'), 'households', HID, 'recipes');
    await assertFails(addDoc(recipes, validRecipe({ isAdmin: true })));
    await assertFails(addDoc(recipes, validRecipe({ createdAt: 'yesterday' })));
  });

  it('lets a member edit a household recipe while its author and date stay the same', async () => {
    const ref = doc(as('alice'), 'households', HID, 'recipes', 'r1');
    await assertSucceeds(updateDoc(ref, { title: 'Changed', ingredients: ['water', 'salt'], label: 'Comfort Food 🥣' }));
  });

  it('blocks an edit that changes who made the recipe or when', async () => {
    const ref = doc(as('alice'), 'households', HID, 'recipes', 'r1');
    await assertFails(updateDoc(ref, { createdBy: 'bob' }));
    await assertFails(updateDoc(ref, { createdAt: new Date(0) }));
  });

  it('applies the same field checks to an edit as to a new recipe', async () => {
    const ref = doc(as('alice'), 'households', HID, 'recipes', 'r1');
    await assertFails(updateDoc(ref, { category: 'Brunch' }));
    await assertFails(updateDoc(ref, { label: 'Spicy' }));
    await assertFails(updateDoc(ref, { time: '<b>20</b>' }));
    await assertFails(updateDoc(ref, { title: '' }));
    await assertFails(updateDoc(ref, { isAdmin: true }));
    await assertFails(updateDoc(ref, { image: 'https://example.com/photo.webp' }));
    await assertFails(updateDoc(ref, { image: `households/${OTHER_HID}/recipes/x.webp` }));
  });

  it('blocks non-members from editing a recipe, in any household', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'households', HID, 'recipes', 'r1'), { title: 'Changed' }));
    await assertFails(updateDoc(doc(as('alice'), 'households', OTHER_HID, 'recipes', 'x1'), { title: 'Changed' }));
  });
});

describe('weekly menu', () => {
  const entry = (overrides: Record<string, unknown> = {}) => ({
    main: 'Pasta',
    side: 'Salad',
    mainRecipeId: 'r1',
    sideRecipeId: '',
    ...overrides,
  });
  const DAY = '2026-10-22';

  it('lets a member write and read their household menu', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry() }, { merge: true }));
    await assertSucceeds(getDoc(doc(as('alice'), 'households', HID, 'menu', DAY)));
  });

  it('blocks non-members from reading or writing the menu', async () => {
    await assertFails(setDoc(doc(as('bob'), 'households', HID, 'menu', DAY), { lunch: entry() }, { merge: true }));
    await assertFails(getDoc(doc(as('bob'), 'households', HID, 'menu', DAY)));
    await assertFails(getDoc(doc(as('alice'), 'households', OTHER_HID, 'menu', DAY)));
  });

  it('rejects days that do not exist in the calendar', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', '2026-02-31'), { lunch: entry() }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', '2026-04-31'), { lunch: entry() }, { merge: true }));
  });

  it('rejects day ids that are not real YYYY-MM-DD dates', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', '2026-13-45'), { lunch: entry() }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', '22-10-2026'), { lunch: entry() }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', 'tomorrow'), { lunch: entry() }, { merge: true }));
  });

  it('accepts a breakfast entry alongside lunch and dinner', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { breakfast: entry() }, { merge: true }));
  });

  it('applies the same entry checks to breakfast as to lunch', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { breakfast: entry({ extra: 'x' }) }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { breakfast: entry({ main: '<b>x</b>' }) }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { breakfast: entry({ mainRecipeId: '../secrets' }) }, { merge: true }));
  });

  it('rejects fields other than breakfast, lunch and dinner, and extra entry fields', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { brunch: entry() }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ extra: 'x' }) }, { merge: true }));
  });

  it('rejects markup and over-long text in a meal', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ main: '<b>x</b>' }) }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ side: 'x'.repeat(101) }) }, { merge: true }));
  });

  it('rejects markup that follows a line break in a meal', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ main: 'soup\n<b>x</b>' }) }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { breakfast: entry({ side: 'toast\n<i>x' }) }, { merge: true }));
  });

  it('rejects a recipe id that is not a plain id', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ mainRecipeId: '../secrets' }) }, { merge: true }));
  });

  it('rejects a recipe link when the meal has no text', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ main: '', mainRecipeId: 'r1' }) }, { merge: true }));
  });

  it('does not allow a day to be deleted', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry() }, { merge: true }));
    await assertFails(deleteDoc(doc(as('alice'), 'households', HID, 'menu', DAY)));
  });
});

// A household with alice as owner, bob and carol as members, and eve outside it.
const addMembers = () =>
  env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'households', HID, 'members', 'bob'), { role: 'member', joinedAt: new Date(), inviteCode: 'VALID234' });
    await setDoc(doc(db, 'households', HID, 'members', 'carol'), { role: 'member', joinedAt: new Date(), inviteCode: 'VALID234' });
  });

describe('shared invite link', () => {
  const invite = () => ({
    householdId: HID,
    createdBy: 'alice',
    inviterName: 'Alice',
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + DAY_MS),
  });

  it('requires the inviter name, as a string without blocked characters', async () => {
    const withoutName: Record<string, unknown> = { ...invite() };
    delete withoutName.inviterName;
    await assertFails(setDoc(doc(as('alice'), 'inviteCodes', 'NNMEX234'), withoutName));
    await assertFails(setDoc(doc(as('alice'), 'inviteCodes', 'MARKUP23'), { ...invite(), inviterName: '<b>Alice</b>' }));
    await assertFails(setDoc(doc(as('alice'), 'inviteCodes', 'NUMBER23'), { ...invite(), inviterName: 42 }));
    await assertSucceeds(setDoc(doc(as('alice'), 'inviteCodes', 'NAMED234'), invite()));
  });

  it('lets only the owner create invites, not another member', async () => {
    await addMembers();
    await assertSucceeds(setDoc(doc(as('alice'), 'inviteCodes', 'WNER2345'), invite()));
    await assertFails(setDoc(doc(as('bob'), 'inviteCodes', 'BBNVX234'), { ...invite(), createdBy: 'bob' }));
  });
});

describe('member removal', () => {
  beforeEach(addMembers);

  it('lets the owner remove a member', async () => {
    await assertSucceeds(deleteDoc(doc(as('alice'), 'households', HID, 'members', 'bob')));
  });

  it('does not let a member remove another member', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'households', HID, 'members', 'carol')));
  });

  it('does not let the owner remove themselves', async () => {
    await assertFails(deleteDoc(doc(as('alice'), 'households', HID, 'members', 'alice')));
  });

  it('does not let a non-member, or the owner of another household, remove anyone here', async () => {
    await assertFails(deleteDoc(doc(as('eve'), 'households', HID, 'members', 'bob')));
    await assertFails(deleteDoc(doc(as('dave'), 'households', HID, 'members', 'bob')));
  });

  it('cuts off a removed member from the household data', async () => {
    await assertSucceeds(getDocs(collection(as('bob'), 'households', HID, 'groceries')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'households', HID, 'members', 'bob')));
    await assertFails(getDocs(collection(as('bob'), 'households', HID, 'groceries')));
    await assertFails(setDoc(doc(as('bob'), 'households', HID, 'groceries', 'g9'), { ...newGrocery('Eggs'), createdBy: 'bob' }));
  });
});

describe('strict keys and types (audit fixes)', () => {
  it('refuses extra fields on a new household', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'households', 'hh-new'), { name: 'Home', ownerUid: 'alice', createdAt: new Date(), plan: 'pro' }),
    );
    await assertSucceeds(setDoc(doc(as('alice'), 'households', 'hh-new'), { name: 'Home', ownerUid: 'alice', createdAt: new Date() }));
  });

  it('refuses extra fields on a member document', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'households', 'hh-new2', 'members', 'alice'), {
        role: 'owner',
        joinedAt: new Date(),
        displayName: '',
        isAdmin: true,
      }),
    );
  });

  it('requires a timestamp createdAt on a new grocery item', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'groceries', 'g7'), { ...newGrocery('Eggs'), createdAt: 'yesterday' }));
  });

  it('does not let the createdAt of an item change', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'households', HID, 'groceries', 'g1'), { createdAt: new Date(0) }));
  });
});

describe('expired invites and removed members', () => {
  beforeEach(addMembers);

  it('does not let a signed-in user read an expired invite', async () => {
    await assertFails(getDoc(doc(as('bob'), 'inviteCodes', 'EXPIRED2')));
    await assertSucceeds(getDoc(doc(as('bob'), 'inviteCodes', 'VALID234')));
  });

  it('keeps a removed member out, even with a valid link', async () => {
    const owner = as('alice');
    const batch = writeBatch(owner);
    batch.delete(doc(owner, 'households', HID, 'members', 'bob'));
    batch.set(doc(owner, 'households', HID, 'removed', 'bob'), { removedAt: serverTimestamp() });
    await assertSucceeds(batch.commit());

    await assertFails(
      setDoc(doc(as('bob'), 'households', HID, 'members', 'bob'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'VALID234',
      }),
    );
    await assertSucceeds(getDoc(doc(as('bob'), 'households', HID, 'removed', 'bob')));
  });

  it('lets only the owner record a removal, and never for themselves', async () => {
    await assertFails(setDoc(doc(as('bob'), 'households', HID, 'removed', 'carol'), { removedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'removed', 'alice'), { removedAt: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(as('alice'), 'households', HID, 'removed', 'carol'), { removedAt: serverTimestamp() }));
  });
});

describe('review follow-ups: invite delete, removal target, join time', () => {
  beforeEach(addMembers);

  it('lets only the owner delete an invite', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'inviteCodes', 'VALID234')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'inviteCodes', 'VALID234')));
  });

  it('records a removal only for a current member', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'removed', 'dave'), { removedAt: serverTimestamp() }));
  });

  it('refuses a join without a timestamp joinedAt', async () => {
    await assertFails(
      setDoc(doc(as('eve'), 'households', HID, 'members', 'eve'), {
        role: 'member',
        joinedAt: 'soon',
        inviteCode: 'VALID234',
      }),
    );
  });
});

describe('re-adding a removed member', () => {
  beforeEach(addMembers);

  const removeCarol = async () => {
    const owner = as('alice');
    const batch = writeBatch(owner);
    batch.delete(doc(owner, 'households', HID, 'members', 'carol'));
    batch.set(doc(owner, 'households', HID, 'removed', 'carol'), { removedAt: serverTimestamp(), displayName: 'Carol' });
    await assertSucceeds(batch.commit());
  };

  it('lets the owner see the removal record, the removed person see their own, and no one else', async () => {
    await removeCarol();
    await assertSucceeds(getDoc(doc(as('alice'), 'households', HID, 'removed', 'carol')));
    await assertSucceeds(getDoc(doc(as('carol'), 'households', HID, 'removed', 'carol')));
    await assertFails(getDoc(doc(as('bob'), 'households', HID, 'removed', 'carol')));
  });

  it('lets only the owner clear a removal, after which the person can join with the link again', async () => {
    await removeCarol();
    const rejoin = () =>
      setDoc(doc(as('carol'), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'VALID234',
      });
    await assertFails(rejoin());

    await assertFails(deleteDoc(doc(as('bob'), 'households', HID, 'removed', 'carol')));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'households', HID, 'removed', 'carol')));

    await assertSucceeds(rejoin());
  });

  it('accepts a display name on the removal record, and refuses markup in it', async () => {
    await assertFails(
      setDoc(doc(as('alice'), 'households', HID, 'removed', 'carol'), { removedAt: serverTimestamp(), displayName: '<b>Carol</b>' }),
    );
    await assertSucceeds(
      setDoc(doc(as('alice'), 'households', HID, 'removed', 'carol'), { removedAt: serverTimestamp(), displayName: 'Carol' }),
    );
  });
});
