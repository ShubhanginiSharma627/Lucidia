import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Category, Subject, RevisionSchedule, RevisionLog } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate connection to Firestore as required by skill guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting...');
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth functions
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  // Ensure user profile doc exists
  if (result.user) {
    try {
      await setDoc(doc(db, 'users', result.user.uid), {
        id: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.warn('Could not update user profile doc:', e);
    }
  }
  return result.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

function stripUndefined<T extends Record<string, unknown>>(data: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

// Firestore Realtime Synchronization
export async function syncCategory(userId: string, category: Category): Promise<void> {
  const path = `users/${userId}/categories`;
  try {
    await setDoc(doc(db, path, category.id), stripUndefined({
      ...category,
      userId,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${category.id}`);
  }
}

export async function deleteCategoryDoc(userId: string, categoryId: string): Promise<void> {
  const path = `users/${userId}/categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncSubject(userId: string, subject: Subject): Promise<void> {
  const path = `users/${userId}/subjects`;
  try {
    await setDoc(doc(db, path, subject.id), stripUndefined({
      ...subject,
      userId,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${subject.id}`);
  }
}

export async function deleteSubjectDoc(userId: string, subjectId: string): Promise<void> {
  const path = `users/${userId}/subjects/${subjectId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'subjects', subjectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncSchedule(userId: string, schedule: RevisionSchedule): Promise<void> {
  const path = `users/${userId}/schedules`;
  try {
    await setDoc(doc(db, path, schedule.id), stripUndefined({
      ...schedule,
      userId,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${schedule.id}`);
  }
}

export async function deleteScheduleDoc(userId: string, scheduleId: string): Promise<void> {
  const path = `users/${userId}/schedules/${scheduleId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'schedules', scheduleId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function syncLog(userId: string, log: RevisionLog): Promise<void> {
  const path = `users/${userId}/logs`;
  try {
    await setDoc(doc(db, path, log.id), stripUndefined({
      ...log,
      userId,
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${path}/${log.id}`);
  }
}

export function subscribeToUserUserData(
  userId: string,
  callbacks: {
    onCategories: (cats: Category[]) => void;
    onSubjects: (subs: Subject[]) => void;
    onSchedules: (scheds: RevisionSchedule[]) => void;
    onLogs: (logs: RevisionLog[]) => void;
  }
) {
  const unsubCats = onSnapshot(
    collection(db, 'users', userId, 'categories'),
    snapshot => {
      const cats = snapshot.docs.map(d => d.data() as Category);
      callbacks.onCategories(cats);
    },
    err => handleFirestoreError(err, OperationType.GET, `users/${userId}/categories`)
  );

  const unsubSubs = onSnapshot(
    collection(db, 'users', userId, 'subjects'),
    snapshot => {
      const subs = snapshot.docs.map(d => d.data() as Subject);
      callbacks.onSubjects(subs);
    },
    err => handleFirestoreError(err, OperationType.GET, `users/${userId}/subjects`)
  );

  const unsubScheds = onSnapshot(
    collection(db, 'users', userId, 'schedules'),
    snapshot => {
      const scheds = snapshot.docs.map(d => d.data() as RevisionSchedule);
      callbacks.onSchedules(scheds);
    },
    err => handleFirestoreError(err, OperationType.GET, `users/${userId}/schedules`)
  );

  const unsubLogs = onSnapshot(
    collection(db, 'users', userId, 'logs'),
    snapshot => {
      const logs = snapshot.docs.map(d => d.data() as RevisionLog);
      callbacks.onLogs(logs);
    },
    err => handleFirestoreError(err, OperationType.GET, `users/${userId}/logs`)
  );

  return () => {
    unsubCats();
    unsubSubs();
    unsubScheds();
    unsubLogs();
  };
}
