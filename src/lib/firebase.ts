import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  getDocFromServer,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Contact, RecordItem } from '../types';
import { INITIAL_CONTACTS, INITIAL_RECORDS } from '../data/initialData';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection on boot
(async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is running in offline mode or network is unreachable.');
    }
  }
})();

// Real Firebase Auth Functions
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserProfile(result.user);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  nickname: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (nickname) {
    await updateProfile(result.user, { displayName: nickname });
  }
  await syncUserProfile(result.user, nickname);
  try {
    await result.user.reload();
  } catch (err) {
    console.warn('User profile reload deferred:', err);
  }
  return auth.currentUser || result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// User Profile Sync in Firestore
export async function syncUserProfile(user: User, fallbackName?: string) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || `${user.uid.slice(0, 8)}@bodap.guest`,
        displayName: user.displayName || fallbackName || '보답 사용자',
        photoURL:
          user.photoURL ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isAnonymous: user.isAnonymous,
      });
    } else {
      await setDoc(
        userRef,
        {
          lastLoginAt: new Date().toISOString(),
          displayName: user.displayName || fallbackName || userSnap.data().displayName,
          photoURL: user.photoURL || userSnap.data().photoURL,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error('Error syncing user profile:', err);
  }
}

export const SAMPLE_CONTACT_IDS = ['c-1', 'c-2', 'c-3', 'c-4', 'c-5', 'c-6', 'c-7', 'c-8'];
export const SAMPLE_RECORD_IDS = ['r-1', 'r-2', 'r-3', 'r-4', 'r-5', 'r-6', 'r-7', 'r-8', 'r-9', 'r-10'];

// Purge any mock sample records/contacts from the user's Firestore database
export async function purgeSampleDataFromFirestore(userId: string) {
  try {
    const batch = writeBatch(db);
    for (const cid of SAMPLE_CONTACT_IDS) {
      batch.delete(doc(db, 'users', userId, 'contacts', cid));
    }
    for (const rid of SAMPLE_RECORD_IDS) {
      batch.delete(doc(db, 'users', userId, 'records', rid));
    }
    await batch.commit();

    // Also scan and delete any contacts named '한수진' or '강태웅' or matching sample IDs
    const colRef = collection(db, 'users', userId, 'contacts');
    const snapshot = await getDocs(colRef);
    const deleteBatch = writeBatch(db);
    let hasDeletes = false;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        SAMPLE_CONTACT_IDS.includes(docSnap.id) ||
        data.name === '한수진' ||
        data.name === '강태웅'
      ) {
        deleteBatch.delete(docSnap.ref);
        hasDeletes = true;
      }
    });
    if (hasDeletes) {
      await deleteBatch.commit();
    }
  } catch (err) {
    console.error('Error purging sample data from Firestore:', err);
  }
}

// Seed initial sample data only if explicitly requested by user in settings
export async function seedInitialUserData(userId: string) {
  try {
    const batch = writeBatch(db);

    // Seed contacts
    for (const c of INITIAL_CONTACTS) {
      const contactRef = doc(db, 'users', userId, 'contacts', c.id);
      batch.set(contactRef, { ...c, userId });
    }

    // Seed records
    for (const r of INITIAL_RECORDS) {
      const recordRef = doc(db, 'users', userId, 'records', r.id);
      batch.set(recordRef, { ...r, userId });
    }

    await batch.commit();
  } catch (err) {
    console.error('Error seeding initial user data in Firestore:', err);
  }
}

// Firestore Realtime Contacts Subscription (returns ONLY user registered contacts)
export function subscribeUserContacts(
  userId: string,
  onUpdate: (contacts: Contact[]) => void
) {
  // Proactively purge any leftover sample contacts (c-7, c-8, 한수진, 강태웅)
  purgeSampleDataFromFirestore(userId).catch(() => {});

  const colRef = collection(db, 'users', userId, 'contacts');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Contact[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Contact;
        // Filter out sample data so only real user data is displayed
        if (
          !SAMPLE_CONTACT_IDS.includes(data.id) &&
          data.name !== '한수진' &&
          data.name !== '강태웅'
        ) {
          list.push(data);
        }
      });
      onUpdate(list);
    },
    (error) => {
      console.error('Error subscribing to contacts:', error);
    }
  );
}

// Firestore Realtime Records Subscription (returns ONLY user registered records)
export function subscribeUserRecords(
  userId: string,
  onUpdate: (records: RecordItem[]) => void
) {
  const colRef = collection(db, 'users', userId, 'records');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: RecordItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as RecordItem;
        // Filter out sample data so only real user data is displayed
        if (!SAMPLE_RECORD_IDS.includes(data.id)) {
          list.push(data);
        }
      });
      // Sort newest first
      list.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      onUpdate(list);
    },
    (error) => {
      console.error('Error subscribing to records:', error);
    }
  );
}

// Helper to remove undefined fields which Firestore rejects
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

// Save or Update Record
export async function saveRecordToFirestore(userId: string, record: RecordItem) {
  const recordRef = doc(db, 'users', userId, 'records', record.id);
  await setDoc(recordRef, sanitizeForFirestore({ ...record, userId }), { merge: true });
}

// Save or Update Contact
export async function saveContactToFirestore(userId: string, contact: Contact) {
  const contactRef = doc(db, 'users', userId, 'contacts', contact.id);
  await setDoc(contactRef, sanitizeForFirestore({ ...contact, userId }), { merge: true });
}

// Delete Record
export async function deleteRecordFromFirestore(userId: string, recordId: string) {
  const recordRef = doc(db, 'users', userId, 'records', recordId);
  await deleteDoc(recordRef);
}

// Delete Contact
export async function deleteContactFromFirestore(userId: string, contactId: string) {
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  await deleteDoc(contactRef);
}

// Bulk Save Records and Contacts (for Excel batch upload)
export async function saveBatchRecordsAndContactsToFirestore(
  userId: string,
  records: RecordItem[],
  contacts: Contact[]
) {
  // Process in chunks of 200 (Firestore max 500 per batch)
  const allOps: Array<{ type: 'record' | 'contact'; data: any; id: string }> = [
    ...contacts.map((c) => ({ type: 'contact' as const, data: c, id: c.id })),
    ...records.map((r) => ({ type: 'record' as const, data: r, id: r.id })),
  ];

  const chunkSize = 200;
  for (let i = 0; i < allOps.length; i += chunkSize) {
    const chunk = allOps.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const op of chunk) {
      if (op.type === 'contact') {
        const ref = doc(db, 'users', userId, 'contacts', op.id);
        batch.set(ref, sanitizeForFirestore({ ...op.data, userId }), { merge: true });
      } else {
        const ref = doc(db, 'users', userId, 'records', op.id);
        batch.set(ref, sanitizeForFirestore({ ...op.data, userId }), { merge: true });
      }
    }
    await batch.commit();
  }
}
