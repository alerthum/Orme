"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import type { AppUser, UserRole } from "@/types";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import * as React from "react";

type AuthState = {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOutApp: () => Promise<void>;
  demoSignIn: () => void;
};

const Ctx = React.createContext<AuthState | null>(null);

function mapProfile(u: User): AppUser {
  return {
    uid: u.uid,
    email: u.email ?? "user@local",
    displayName: u.displayName ?? "Kullanıcı",
    role: "admin",
    createdAt: new Date(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const skip =
      process.env.NEXT_PUBLIC_DEMO_SKIP_AUTH === "true" || !isFirebaseConfigured();
    if (skip) {
      setProfile({
        uid: "demo",
        email: "demo@yokus.local",
        displayName: "Demo Kullanıcı",
        role: "admin" as UserRole,
        createdAt: new Date(),
      });
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setProfile(u ? mapProfile(u) : null);
      setLoading(false);
    });
  }, []);

  const signInEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase yapılandırılmadı");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInGoogle = async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase yapılandırılmadı");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOutApp = async () => {
    if (!isFirebaseConfigured()) {
      setProfile({
        uid: "demo",
        email: "demo@yokus.local",
        displayName: "Demo Kullanıcı",
        role: "admin",
        createdAt: new Date(),
      });
      return;
    }
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const demoSignIn = () => {
    setProfile({
      uid: "demo",
      email: "demo@yokus.local",
      displayName: "Demo Kullanıcı",
      role: "admin",
      createdAt: new Date(),
    });
  };

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        loading,
        signInEmail,
        signInGoogle,
        signOutApp,
        demoSignIn,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth inside AuthProvider");
  return v;
}
