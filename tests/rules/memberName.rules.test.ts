import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

// Member names: a member may store their own displayName and nothing else on their member record.
// Runs against the Firestore emulator: `npm run test:rules` (needs Java).

const HID = 'hh-1';
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'households', HID), { name: 'Home', ownerUid: 'alice', createdAt: new Date() });
    await setDoc(doc(db, 'households', HID, 'members', 'alice'), { role: 'owner', joinedAt: new Date(), displayName: 'Alice' });
    await setDoc(doc(db, 'households', HID, 'members', 'bob'), { role: 'member', joinedAt: new Date(), displayName: 'Bob' });
    await setDoc(doc(db, 'inviteCodes', 'ABCD2345'), { householdId: HID, createdBy: 'alice', expiresAt: FUTURE });
  });
});

const memberRef = (uid: string, asUid: string) =>
  doc(env.authenticatedContext(asUid).firestore(), 'households', HID, 'members', uid);

describe('member names on create', () => {
  it('lets a joiner store a plain name with the invite', async () => {
    await assertSucceeds(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        displayName: 'Carol',
      }),
    );
  });

  it('rejects a name with characters the app never accepts', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        displayName: '<script>',
      }),
    );
  });

  it('rejects a blocked character that comes after a newline', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        displayName: 'Carol\n<b>x</b>',
      }),
    );
  });

  it('rejects a name longer than 100 characters', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        displayName: 'x'.repeat(101),
      }),
    );
  });
});

describe('member names on update', () => {
  it('lets a member change their own displayName', async () => {
    await assertSucceeds(updateDoc(memberRef('bob', 'bob'), { displayName: 'Bobby' }));
  });

  it('rejects a member changing someone else\'s displayName', async () => {
    await assertFails(updateDoc(memberRef('bob', 'alice'), { displayName: 'Hacked' }));
  });

  it('rejects a member changing their own role', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { role: 'owner' }));
  });

  it('rejects a member changing their own join date', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { joinedAt: new Date(0) }));
  });

  it('rejects an invalid name on update', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { displayName: '<b>x</b>' }));
  });
});

describe('member photos', () => {
  const PHOTO = 'https://lh3.googleusercontent.com/a/ACg8ocK=s96-c';

  it('lets a joiner store a Google profile picture with the invite', async () => {
    await assertSucceeds(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        displayName: 'Carol',
        photoUrl: PHOTO,
      }),
    );
  });

  it('accepts a Google picture link with a size parameter', async () => {
    await assertSucceeds(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        photoUrl: 'https://lh3.googleusercontent.com/a/ACg8ocK=s96-c?sz=96',
      }),
    );
  });

  it('rejects a picture hosted anywhere other than Google', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('carol').firestore(), 'households', HID, 'members', 'carol'), {
        role: 'member',
        joinedAt: new Date(),
        inviteCode: 'ABCD2345',
        photoUrl: 'https://tracker.example.com/pixel.png',
      }),
    );
  });

  it('lets a member change their own picture', async () => {
    await assertSucceeds(updateDoc(memberRef('bob', 'bob'), { photoUrl: PHOTO }));
  });

  it('rejects a picture change for someone else', async () => {
    await assertFails(updateDoc(memberRef('bob', 'alice'), { photoUrl: PHOTO }));
  });

  it('rejects a non-Google picture on update', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { photoUrl: 'https://tracker.example.com/x.png' }));
  });
});
