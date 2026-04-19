import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { Machine } from "@/types";
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

const COL = "machines";

function delay<T>(x: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listMachines(): Promise<Machine[]> {
  if (!isFirebaseConfigured()) {
    return delay([...getMockStore().machines]);
  }
  const db = getFirebaseDb()!;
  const q = query(collection(db, COL), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Machine[];
}

export async function createMachine(
  input: Omit<Machine, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `mc-${Date.now()}`;
    s.machines.push({
      ...input,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
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

export async function updateMachine(
  id: string,
  patch: Partial<Machine>
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.machines.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.machines[i] = { ...s.machines[i]!, ...patch, updatedAt: new Date() };
    }
    return;
  }
  const db = getFirebaseDb()!;
  await updateDoc(doc(db, COL, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMachine(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    getMockStore().machines = getMockStore().machines.filter((x) => x.id !== id);
    return;
  }
  const db = getFirebaseDb()!;
  await deleteDoc(doc(db, COL, id));
}
