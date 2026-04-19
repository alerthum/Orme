import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { FabricRecipe } from "@/types";
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

const COL = "fabricRecipes";

function delay<T>(x: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listFabricRecipes(): Promise<FabricRecipe[]> {
  if (!isFirebaseConfigured()) {
    return delay([...getMockStore().fabricRecipes]);
  }
  const db = getFirebaseDb()!;
  const q = query(collection(db, COL), orderBy("code"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as FabricRecipe[];
}

export async function createFabricRecipe(
  input: Omit<FabricRecipe, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `fr-${Date.now()}`;
    const row: FabricRecipe = {
      ...input,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    s.fabricRecipes.push(row);
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

export async function updateFabricRecipe(
  id: string,
  patch: Partial<FabricRecipe>
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.fabricRecipes.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.fabricRecipes[i] = {
        ...s.fabricRecipes[i]!,
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

export async function deleteFabricRecipe(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    s.fabricRecipes = s.fabricRecipes.filter((x) => x.id !== id);
    return;
  }
  const db = getFirebaseDb()!;
  await deleteDoc(doc(db, COL, id));
}
