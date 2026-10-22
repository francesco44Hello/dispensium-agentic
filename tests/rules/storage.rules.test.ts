import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes, updateMetadata } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

// Runs against the Firestore and Storage emulators: `npm run test:rules` (needs Java).
const HID = 'hh-1';
const OTHER_HID = 'hh-2';
const PNG = new Uint8Array([137, 80, 78, 71]);
const PATH = `households/${HID}/recipes/photo.webp`;

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-dispensium',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearStorage();
  await env.clearFirestore();
  // alice is a member of hh-1; bob is not a member of anything.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'households', HID, 'members', 'alice'), { role: 'owner', joinedAt: new Date() });
    await setDoc(doc(db, 'households', OTHER_HID, 'members', 'dave'), { role: 'owner', joinedAt: new Date() });
  });
});

const as = (uid: string) => env.authenticatedContext(uid).storage();
const anon = () => env.unauthenticatedContext().storage();
const upload = (storage: ReturnType<typeof as>, path: string, bytes: Uint8Array = PNG, contentType = 'image/webp') =>
  uploadBytes(ref(storage, path), bytes, { contentType });

describe('recipe photos', () => {
  it('lets a member upload a small webp, jpeg or png photo for their household', async () => {
    await assertSucceeds(upload(as('alice'), PATH));
    await assertSucceeds(upload(as('alice'), `households/${HID}/recipes/b.jpg`, PNG, 'image/jpeg'));
    await assertSucceeds(upload(as('alice'), `households/${HID}/recipes/c.png`, PNG, 'image/png'));
  });

  it('lets a member read and delete their household photos', async () => {
    await upload(as('alice'), PATH);
    await assertSucceeds(getBytes(ref(as('alice'), PATH)));
    await assertSucceeds(deleteObject(ref(as('alice'), PATH)));
  });

  it('blocks non-members from uploading, reading or deleting', async () => {
    await upload(as('alice'), PATH);
    await assertFails(upload(as('bob'), `households/${HID}/recipes/bob.webp`));
    await assertFails(getBytes(ref(as('bob'), PATH)));
    await assertFails(deleteObject(ref(as('bob'), PATH)));
  });

  it('blocks a member from another household', async () => {
    await assertFails(upload(as('alice'), `households/${OTHER_HID}/recipes/x.webp`));
  });

  it('blocks anonymous access', async () => {
    await upload(as('alice'), PATH);
    await assertFails(getBytes(ref(anon(), PATH)));
    await assertFails(upload(anon(), `households/${HID}/recipes/anon.webp`));
  });

  it('rejects files over 1 MB', async () => {
    const big = new Uint8Array(1024 * 1024 + 1);
    await assertFails(upload(as('alice'), `households/${HID}/recipes/big.webp`, big));
  });

  it('rejects content types other than webp, jpeg and png', async () => {
    await assertFails(upload(as('alice'), `households/${HID}/recipes/page.html`, PNG, 'text/html'));
    await assertFails(upload(as('alice'), `households/${HID}/recipes/vector.svg`, PNG, 'image/svg+xml'));
  });

  it('does not allow a photo metadata to be changed', async () => {
    await upload(as('alice'), PATH);
    await assertFails(updateMetadata(ref(as('alice'), PATH), { contentType: 'image/png' }));
  });
});
