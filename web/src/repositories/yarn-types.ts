import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { YarnType } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const COL = "yarnTypes";

function delay<T>(x: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listYarnTypes(): Promise<YarnType[]> {
  if (!isFirebaseConfigured()) {
    return delay([...getMockStore().yarnTypes]);
  }
  const db = getFirebaseDb()!;
  const q = query(collection(db, COL), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as YarnType[];
}

export async function createYarnType(
  input: Omit<YarnType, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `yt-${Date.now()}`;
    const now = new Date();
    s.yarnTypes.push({
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }
  const db = getFirebaseDb()!;
  const ref = await addDoc(collection(db, COL), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateYarnType(
  id: string,
  patch: Partial<YarnType>
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.yarnTypes.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.yarnTypes[i] = {
        ...s.yarnTypes[i]!,
        ...patch,
        updatedAt: new Date(),
      };
    }
    return;
  }
  const db = getFirebaseDb()!;
  await updateDoc(doc(db, COL, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteYarnType(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    getMockStore().yarnTypes = getMockStore().yarnTypes.filter((x) => x.id !== id);
    return;
  }
  const db = getFirebaseDb()!;
  await deleteDoc(doc(db, COL, id));
}
