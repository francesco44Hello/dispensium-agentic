import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

// Member photos: a member may pick a bundled avatar or their Google picture, and nothing else.
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

describe('member photos: bundled avatars', () => {
  it('lets a member pick a bundled avatar as their own photo', async () => {
    await assertSucceeds(updateDoc(memberRef('bob', 'bob'), { photoUrl: '/avatars/avatar-2.svg' }));
  });

  it('rejects a local path that is not one of the bundled avatars', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { photoUrl: '/avatars/avatar-9.svg' }));
    await assertFails(updateDoc(memberRef('bob', 'bob'), { photoUrl: '//evil.example/avatars/avatar-1.svg' }));
  });

  it('does not let a member change someone else’s photo', async () => {
    await assertFails(updateDoc(memberRef('alice', 'bob'), { photoUrl: '/avatars/avatar-1.svg' }));
  });
});

describe('member photos: Google picture host', () => {
  it('accepts a Google profile picture link', async () => {
    await assertSucceeds(updateDoc(memberRef('bob', 'bob'), { photoUrl: 'https://lh3.googleusercontent.com/a/ACg8ocK' }));
  });

  it('rejects a picture from any other host', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { photoUrl: 'https://evil.example/a.png' }));
  });

  it('rejects a Google link longer than 300 characters', async () => {
    await assertFails(updateDoc(memberRef('bob', 'bob'), { photoUrl: `https://lh3.googleusercontent.com/a/${'x'.repeat(300)}` }));
  });
});
