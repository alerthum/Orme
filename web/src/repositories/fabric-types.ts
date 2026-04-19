import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { FabricType } from "@/types";
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

const COL = "fabricTypes";

function delay<T>(x: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listFabricTypes(): Promise<FabricType[]> {
  if (!isFirebaseConfigured()) {
    return delay([...getMockStore().fabricTypes]);
  }
  const db = getFirebaseDb()!;
  const q = query(collection(db, COL), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FabricType[];
}

export async function createFabricType(
  input: Omit<FabricType, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `ft-${Date.now()}`;
    const row: FabricType = {
      ...input,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    s.fabricTypes.push(row);
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

export async function updateFabricType(
  id: string,
  patch: Partial<FabricType>
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.fabricTypes.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.fabricTypes[i] = {
        ...s.fabricTypes[i]!,
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

export async function deleteFabricType(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    s.fabricTypes = s.fabricTypes.filter((x) => x.id !== id);
    return;
  }
  const db = getFirebaseDb()!;
  await deleteDoc(doc(db, COL, id));
}
