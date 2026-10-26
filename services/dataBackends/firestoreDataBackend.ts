import { cleanPhotoUrl } from '../../utils/photoUrl';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
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
import { defaultCategoryMap } from '../../constants/categories';
import { isCategoryMap, isPartialDayMenu } from '../../utils/dataGuards';
import { hasCode } from '../../utils/hasCode';
import type { CategoryMap } from '../../types/category';
import type { GroceryItem } from '../../types/grocery';
import type { Recipe } from '../../types/recipe';
import type { MenuBackend } from '../menuService';
import type { DayMenu, MealEntry, MealType } from '../../types/menu';
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
  return isCategoryMap(map) ? map : null;
}

// A stored text field is used only when it is a string. Anything else gets the explicit fallback, never String(value).
function textField(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function toRecipe(snap: { id: string; data(): DocumentData | undefined }): Recipe {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    title: textField(data.title, ''),
    time: textField(data.time, ''),
    category: textField(data.category, ''),
    label: textField(data.label, ''),
    ingredients: stringList(data.ingredients),
    steps: stringList(data.steps),
    image: textField(data.image, ''),
    createdAt: toDate(data.createdAt),
    createdBy: textField(data.createdBy, ''),
  };
}

function toGroceryItem(snap: QueryDocumentSnapshot<DocumentData> | { id: string; data(): DocumentData | undefined }): GroceryItem {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    name: textField(data.name, ''),
    category: textField(data.category, 'other'),
    completed: data.completed === true,
    createdAt: toDate(data.createdAt),
    createdBy: textField(data.createdBy, ''),
  };
}

const sortByJoined = (members: HouseholdMember[]) =>
  [...members].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

export function createFirestoreDataBackend(): DataBackend {
  const householdBackend: HouseholdBackend = {
    async ensureDefaultHousehold(uid, displayName, photoUrl) {
      const userRef = doc(db(), 'users', uid);
      return runTransaction(db(), async (tx) => {
        const userSnap = await tx.get(userRef);
        const existing = userSnap.data()?.activeHouseholdId;
        if (typeof existing === 'string') return existing;

        const householdRef = doc(collection(db(), 'households'));
        const createdAt = new Date();
        tx.set(householdRef, { name: 'My household', ownerUid: uid, createdAt });
        tx.set(doc(householdRef, 'members', uid), {
          role: 'owner',
          joinedAt: createdAt,
          displayName,
          ...(photoUrl ? { photoUrl } : {}),
        });
        tx.set(doc(householdRef, 'configuration', 'categoryMap'), { map: defaultCategoryMap });
        tx.set(userRef, { activeHouseholdId: householdRef.id, createdAt }, { merge: true });
        return householdRef.id;
      });
    },

    async createInvite(householdId, createdBy, invite: InviteCode) {
      const memberSnap = await getDoc(doc(db(), 'households', householdId, 'members', createdBy));
      if (!memberSnap.exists()) throw new HouseholdError('not-a-member');
      // createdAt is the server's clock: the rules accept an invite only when createdAt equals request.time.
      await setDoc(doc(db(), 'inviteCodes', invite.code), {
        householdId,
        createdBy,
        createdAt: serverTimestamp(),
        expiresAt: invite.expiresAt,
      });
      return invite;
    },

    async joinWithCode(uid, code, at, displayName, photoUrl) {
      return runTransaction(db(), async (tx) => {
        const inviteSnap = await tx.get(doc(db(), 'inviteCodes', code));
        if (!inviteSnap.exists()) throw new HouseholdError('invalid-invite');

        // A malformed invite must not become a membership path such as households/undefined/members/{uid}.
        const householdId: unknown = inviteSnap.data().householdId;
        if (typeof householdId !== 'string' || householdId === '') throw new HouseholdError('invalid-invite');
        if (toDate(inviteSnap.data().expiresAt).getTime() <= at.getTime()) {
          throw new HouseholdError('expired-invite');
        }

        const memberRef = doc(db(), 'households', householdId, 'members', uid);
        if ((await tx.get(memberRef)).exists()) throw new HouseholdError('already-member');

        tx.set(memberRef, {
          role: 'member',
          joinedAt: at,
          inviteCode: code,
          displayName,
          ...(photoUrl ? { photoUrl } : {}),
        });
        tx.set(doc(db(), 'users', uid), { activeHouseholdId: householdId }, { merge: true });
        return householdId;
      });
    },

    async saveMemberPhoto(householdId, uid, photoUrl) {
      if (!photoUrl) return;
      await updateDoc(doc(db(), 'households', householdId, 'members', uid), { photoUrl });
    },

    async saveMemberName(householdId, uid, displayName) {
      await updateDoc(doc(db(), 'households', householdId, 'members', uid), { displayName });
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
            snap.docs.map((d) => {
              const name: unknown = d.data().displayName;
              const photo: unknown = d.data().photoUrl;
              const cleanPhoto = typeof photo === 'string' ? cleanPhotoUrl(photo) : '';
              return {
                uid: d.id,
                role: d.data().role === 'owner' ? 'owner' : 'member',
                joinedAt: toDate(d.data().joinedAt),
                ...(typeof name === 'string' && name !== '' ? { displayName: name } : {}),
                ...(cleanPhoto !== '' ? { photoUrl: cleanPhoto } : {}),
              };
            }),
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
      const code = hasCode(error) ? error.code : undefined;
      throw new GroceryError(code === 'not-found' ? 'not-found' : 'unknown');
    }
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

  // Layout: households/{hid}/menu/{YYYY-MM-DD} holds { lunch: entry, dinner: entry }.
  const menuBackend: MenuBackend = {
    async setMeal(householdId, date, meal: MealType, entry: MealEntry) {
      await setDoc(doc(db(), 'households', householdId, 'menu', date), { [meal]: entry }, { merge: true });
    },

    subscribeToMenu(householdId, dates, listener): Unsubscribe {
      if (dates.length === 0) {
        listener({});
        return () => undefined;
      }
      // 'in' takes at most 30 values, and the screen asks for 14 days.
      const menuQuery = query(collection(db(), 'households', householdId, 'menu'), where(documentId(), 'in', dates));
      return onSnapshot(menuQuery, (snap) => {
        const menu: Record<string, Partial<DayMenu>> = {};
        for (const day of snap.docs) {
          const data: unknown = day.data();
          menu[day.id] = isPartialDayMenu(data) ? data : {};
        }
        listener(menu);
      });
    },
  };

  return { households: householdBackend, groceries: groceryBackend, recipes: recipeBackend, menu: menuBackend };
}
