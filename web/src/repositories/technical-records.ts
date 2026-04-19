import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { TechnicalRecord } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const COL = "technicalRecords";

function delay<T>(x: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(x), ms));
}

export async function listTechnicalRecords(
  fabricTypeId?: string
): Promise<TechnicalRecord[]> {
  if (!isFirebaseConfigured()) {
    let rows = [...getMockStore().technicalRecords];
    if (fabricTypeId) {
      rows = rows.filter((r) => r.fabricTypeId === fabricTypeId);
    }
    return delay(rows);
  }
  const db = getFirebaseDb()!;
  const base = collection(db, COL);
  const q = fabricTypeId
    ? query(base, where("fabricTypeId", "==", fabricTypeId))
    : query(base);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as TechnicalRecord[];
}

export async function createTechnicalRecord(
  input: Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const id = `tr-${Date.now()}`;
    s.technicalRecords.push({
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

export async function updateTechnicalRecord(
  id: string,
  patch: Partial<TechnicalRecord>
): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    const i = s.technicalRecords.findIndex((x) => x.id === id);
    if (i >= 0) {
      s.technicalRecords[i] = {
        ...s.technicalRecords[i]!,
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

export async function deleteTechnicalRecord(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    getMockStore().technicalRecords = getMockStore().technicalRecords.filter(
      (x) => x.id !== id
    );
    return;
  }
  const db = getFirebaseDb()!;
  await deleteDoc(doc(db, COL, id));
}

/** Aynı kaynak dosya + sayfadan gelen kayıtları silip yenilerini yazar (mock + Firebase). */
export async function replaceTechnicalRecordsFromSource(
  sourceFileName: string,
  sourceSheetName: string,
  rows: Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt">[]
): Promise<number> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    s.technicalRecords = s.technicalRecords.filter(
      (r) =>
        !(
          r.sourceFileName === sourceFileName &&
          r.sourceSheetName === sourceSheetName
        )
    );
    const ts = Date.now();
    rows.forEach((input, i) => {
      s.technicalRecords.push({
        ...input,
        id: `tr-${ts}-${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    return rows.length;
  }
  const db = getFirebaseDb()!;
  const base = collection(db, COL);
  const qy = query(
    base,
    where("sourceFileName", "==", sourceFileName),
    where("sourceSheetName", "==", sourceSheetName)
  );
  const snap = await getDocs(qy);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  for (const input of rows) {
    await addDoc(collection(db, COL), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return rows.length;
}
