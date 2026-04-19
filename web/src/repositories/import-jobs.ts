import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { ImportJob } from "@/types";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

const COL = "importJobs";

function delay<T>(x: T, ms = 60): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listImportJobs(): Promise<ImportJob[]> {
  if (!isFirebaseConfigured()) {
    return delay(
      [...getMockStore().importJobs].sort(
        (a, b) =>
          new Date(b.createdAt as Date).getTime() -
          new Date(a.createdAt as Date).getTime()
      )
    );
  }
  const db = getFirebaseDb()!;
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ImportJob[];
}

export async function createImportJob(
  input: Omit<ImportJob, "id" | "createdAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `ij-${Date.now()}`;
    s.importJobs.unshift({
      ...input,
      id,
      createdAt: new Date(),
    });
    return id;
  }
  const db = getFirebaseDb()!;
  const ref = await addDoc(collection(db, COL), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateImportJob(
  id: string,
  patch: Partial<ImportJob>
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.importJobs.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.importJobs[i] = { ...s.importJobs[i]!, ...patch };
    }
    return;
  }
  const db = getFirebaseDb()!;
  await updateDoc(doc(db, COL, id), patch);
}
