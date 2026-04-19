import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { Order } from "@/types";
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

const COL = "orders";

function delay<T>(x: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listOrders(): Promise<Order[]> {
  if (!isFirebaseConfigured()) {
    return delay(
      [...getMockStore().orders].sort(
        (a, b) =>
          new Date(b.createdAt as Date).getTime() -
          new Date(a.createdAt as Date).getTime()
      )
    );
  }
  const db = getFirebaseDb()!;
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];
}

export async function createOrder(
  input: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `ord-${Date.now()}`;
    s.orders.unshift({
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

export async function updateOrder(id: string, patch: Partial<Order>): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.orders.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.orders[i] = { ...s.orders[i]!, ...patch, updatedAt: new Date() };
    }
    return;
  }
  const db = getFirebaseDb()!;
  await updateDoc(doc(db, COL, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    getMockStore().orders = getMockStore().orders.filter((x) => x.id !== id);
    return;
  }
  const db = getFirebaseDb()!;
  await deleteDoc(doc(db, COL, id));
}
