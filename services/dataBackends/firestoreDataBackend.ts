import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseApp } from '../firebaseApp';
import { deleteObject, getBytes, getStorage, ref, uploadBytes } from 'firebase/storage';
import { HouseholdError, type HouseholdBackend } from '../householdService';
import { GroceryError, type GroceryBackend } from '../groceryService';
import type { NewRecipe, RecipeBackend } from '../recipeService';
import { addWord, removeWord } from '../../utils/categoryMap';
import { defaultCategoryMap } from '../../constants/categories';
import type { CategoryMap } from '../../types/category';
import type { GroceryItem } from '../../types/grocery';
import type { Recipe } from '../../types/recipe';
import type { HouseholdMember, InviteCode } from '../../types/household';
import type { Unsubscribe } from '../../types/subscription';
import type { DataBackend } from './dataBackend';

// Firestore layout: households/{hid}/{members,groceries,configuration}, users/{uid}, inviteCodes/{code}.
// Lazily resolved so importing this module on the server is safe.
const db = (): Firestore => getFirestore(getFirebaseApp());
const BATCH_LIMIT = 500;

function toDate(value: unknown): Date {
  return typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function'
    ? (value.toDate() as Date)
    : new Date(0);
}

function readCategoryMap(data: DocumentData | undefined): CategoryMap | null {
  const map: unknown = data?.map;
  if (typeof map !== 'object' || map === null) return null;
  return map as CategoryMap;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function toRecipe(snap: { id: string; data(): DocumentData | undefined }): Recipe {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    title: String(data.title ?? ''),
    time: String(data.time ?? ''),
    category: String(data.category ?? ''),
    label: String(data.label ?? ''),
    ingredients: stringList(data.ingredients),
    steps: stringList(data.steps),
    image: String(data.image ?? ''),
    createdAt: toDate(data.createdAt),
    createdBy: String(data.createdBy ?? ''),
  };
}

function toGroceryItem(snap: QueryDocumentSnapshot<DocumentData> | { id: string; data(): DocumentData | undefined }): GroceryItem {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    name: String(data.name ?? ''),
    category: String(data.category ?? 'other'),
    completed: data.completed === true,
    createdAt: toDate(data.createdAt),
    createdBy: String(data.createdBy ?? ''),
  };
}

const sortByJoined = (members: HouseholdMember[]) =>
  [...members].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

export function createFirestoreDataBackend(): DataBackend {
  const householdBackend: HouseholdBackend = {
    async ensureDefaultHousehold(uid) {
      const userRef = doc(db(), 'users', uid);
      return runTransaction(db(), async (tx) => {
        const userSnap = await tx.get(userRef);
        const existing = userSnap.data()?.activeHouseholdId;
        if (typeof existing === 'string') return existing;

        const householdRef = doc(collection(db(), 'households'));
        const createdAt = new Date();
        tx.set(householdRef, { name: 'My household', ownerUid: uid, createdAt });
        tx.set(doc(householdRef, 'members', uid), { role: 'owner', joinedAt: createdAt });
        tx.set(doc(householdRef, 'configuration', 'categoryMap'), { map: defaultCategoryMap });
        tx.set(userRef, { activeHouseholdId: householdRef.id, createdAt }, { merge: true });
        return householdRef.id;
      });
    },

    async createInvite(householdId, createdBy, invite: InviteCode) {
      const memberSnap = await getDoc(doc(db(), 'households', householdId, 'members', createdBy));
      if (!memberSnap.exists()) throw new HouseholdError('not-a-member');
      await setDoc(doc(db(), 'inviteCodes', invite.code), {
        householdId,
        createdBy,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      });
      return invite;
    },

    async joinWithCode(uid, code, at) {
      return runTransaction(db(), async (tx) => {
        const inviteSnap = await tx.get(doc(db(), 'inviteCodes', code));
        if (!inviteSnap.exists()) throw new HouseholdError('invalid-invite');

        const householdId = String(inviteSnap.data().householdId);
        if (toDate(inviteSnap.data().expiresAt).getTime() <= at.getTime()) {
          throw new HouseholdError('expired-invite');
        }

        const memberRef = doc(db(), 'households', householdId, 'members', uid);
        if ((await tx.get(memberRef)).exists()) throw new HouseholdError('already-member');

        tx.set(memberRef, { role: 'member', joinedAt: at, inviteCode: code });
        tx.set(doc(db(), 'users', uid), { activeHouseholdId: householdId }, { merge: true });
        return householdId;
      });
    },

    subscribeToActiveHousehold(uid, listener): Unsubscribe {
      return onSnapshot(doc(db(), 'users', uid), (snap) => {
        const id = snap.data()?.activeHouseholdId;
        listener(typeof id === 'string' ? id : null);
      });
    },

    subscribeToMembers(householdId, listener): Unsubscribe {
      return onSnapshot(collection(db(), 'households', householdId, 'members'), (snap) => {
        listener(
          sortByJoined(
            snap.docs.map((d) => ({
              uid: d.id,
              role: d.data().role === 'owner' ? 'owner' : 'member',
              joinedAt: toDate(d.data().joinedAt),
            })),
          ),
        );
      });
    },
  };

  const groceryBackend: GroceryBackend = {
    async getCategoryMap(householdId) {
      const snap = await getDoc(doc(db(), 'households', householdId, 'configuration', 'categoryMap'));
      return readCategoryMap(snap.data());
    },

    async addItem(householdId, item) {
      const ref = await addDoc(collection(db(), 'households', householdId, 'groceries'), {
        ...item,
        completed: false,
        createdAt: new Date(),
      });
      return ref.id;
    },

    async renameItem(householdId, id, name, category) {
      await updateItem(householdId, id, { name, category });
    },

    async setCompleted(householdId, id, completed) {
      await updateItem(householdId, id, { completed });
    },

    async deleteItem(householdId, id) {
      await deleteDoc(doc(db(), 'households', householdId, 'groceries', id));
    },

    async deleteCompleted(householdId) {
      const snap = await getDocs(
        query(collection(db(), 'households', householdId, 'groceries'), where('completed', '==', true)),
      );
      for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db());
        snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    },

    subscribeToGroceries(householdId, listener): Unsubscribe {
      const q = query(collection(db(), 'households', householdId, 'groceries'), orderBy('createdAt', 'asc'));
      return onSnapshot(q, (snap) => listener(snap.docs.map((d) => toGroceryItem(d))));
    },

    async addCategoryWord(householdId, category, word) {
      await editCategoryMap(householdId, category, (map) => addWord(map, category, word));
    },

    async removeCategoryWord(householdId, category, word) {
      await editCategoryMap(householdId, category, (map) => removeWord(map, category, word));
    },

    subscribeToCategoryMap(householdId, listener): Unsubscribe {
      return onSnapshot(doc(db(), 'households', householdId, 'configuration', 'categoryMap'), (snap) => {
        listener(readCategoryMap(snap.data()) ?? defaultCategoryMap);
      });
    },
  };

  async function updateItem(householdId: string, id: string, patch: Partial<GroceryItem> & DocumentData) {
    try {
      await updateDoc(doc(db(), 'households', householdId, 'groceries', id), patch);
    } catch (error) {
      const code = (error as { code?: string }).code;
      throw new GroceryError(code === 'not-found' ? 'not-found' : 'unknown');
    }
  }

  // Transactional read-modify-write so concurrent edits to the map are not lost.
  async function editCategoryMap(householdId: string, category: string, edit: (map: CategoryMap) => CategoryMap) {
    const ref = doc(db(), 'households', householdId, 'configuration', 'categoryMap');
    await runTransaction(db(), async (tx) => {
      const current = readCategoryMap((await tx.get(ref)).data()) ?? defaultCategoryMap;
      if (!Object.hasOwn(current, category)) throw new GroceryError('unknown-category');
      tx.set(ref, { map: edit(current) });
    });
  }

  const recipeBackend: RecipeBackend = {
    // Photos are read with getBytes, so every view is checked against storage.rules. No download-token links are created.
    async uploadPhoto(householdId, photo) {
      const path = `households/${householdId}/recipes/${crypto.randomUUID()}.webp`;
      await uploadBytes(ref(getStorage(getFirebaseApp()), path), photo, { contentType: photo.type });
      return path;
    },

    async deletePhoto(path) {
      await deleteObject(ref(getStorage(getFirebaseApp()), path));
    },

    async photoUrl(path) {
      const bytes = await getBytes(ref(getStorage(getFirebaseApp()), path));
      return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
    },

    async addRecipe(householdId: string, recipe: NewRecipe): Promise<string> {
      const docRef = await addDoc(collection(db(), 'households', householdId, 'recipes'), {
        ...recipe,
        createdAt: new Date(),
      });
      return docRef.id;
    },

    subscribeToRecipes(householdId, listener): Unsubscribe {
      const q = query(collection(db(), 'households', householdId, 'recipes'), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snap) => listener(snap.docs.map((d) => toRecipe(d))),
        (error) => console.error('Could not load recipes:', error),
      );
    },
  };

  return { households: householdBackend, groceries: groceryBackend, recipes: recipeBackend };
}
