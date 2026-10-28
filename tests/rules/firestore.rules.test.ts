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

  it('does not allow recipes to be edited', async () => {
    await assertFails(updateDoc(doc(as('alice'), 'households', HID, 'recipes', 'r1'), { title: 'Changed' }));
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

  it('rejects fields other than breakfast, lunch and dinner, and extra entry fields', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { brunch: entry() }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ extra: 'x' }) }, { merge: true }));
  });

  it('rejects markup and over-long text in a meal', async () => {
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ main: '<b>x</b>' }) }, { merge: true }));
    await assertFails(setDoc(doc(as('alice'), 'households', HID, 'menu', DAY), { lunch: entry({ side: 'x'.repeat(101) }) }, { merge: true }));
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
