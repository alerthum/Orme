import { getFirebaseDb } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { getMockStore } from "@/lib/mock-db";
import type { AppSettings } from "@/types";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const DOC_ID = "app";

export async function getAppSettings(): Promise<AppSettings> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore().settings;
    return { ...s, scoringWeights: { ...s.scoringWeights } };
  }
  const db = getFirebaseDb()!;
  const snap = await getDoc(doc(db, "settings", DOC_ID));
  if (!snap.exists()) {
    const defaults: AppSettings = getMockStore().settings;
    await setDoc(doc(db, "settings", DOC_ID), defaults);
    return defaults;
  }
  return snap.data() as AppSettings;
}

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<void> {
  if (!isFirebaseConfigured()) {
    const s = getMockStore();
    s.settings = {
      ...s.settings,
      ...patch,
      scoringWeights: patch.scoringWeights
        ? { ...s.settings.scoringWeights, ...patch.scoringWeights }
        : s.settings.scoringWeights,
      updatedAt: new Date(),
    };
    return;
  }
  const db = getFirebaseDb()!;
  await setDoc(
    doc(db, "settings", DOC_ID),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
