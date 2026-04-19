import { isFirebaseConfigured } from "@/lib/firebase/config";

export function useFirestoreMode(): boolean {
  return isFirebaseConfigured();
}

export function isMockMode(): boolean {
  return !isFirebaseConfigured();
}
