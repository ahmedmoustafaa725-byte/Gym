"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Role, User } from "@/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const storageKey = "nilefit:user";
const adminEmails = ["ahmeedmostafaa@hotmail.com"];

function roleFromEmail(email: string): Role {
  const normalized = email.toLowerCase();
  return normalized.includes("admin") || adminEmails.includes(normalized) ? "admin" : "user";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        if (active && sessionUser) {
          setUser({
            id: sessionUser.id,
            email: sessionUser.email ?? "",
            name: sessionUser.user_metadata.name ?? sessionUser.email?.split("@")[0] ?? "Athlete",
            role: roleFromEmail(sessionUser.email ?? "") === "admin" ? "admin" : (sessionUser.user_metadata.role as Role) ?? "user",
            onboardingComplete: Boolean(sessionUser.user_metadata.onboardingComplete)
          });
        }
      } else {
        const stored = window.localStorage.getItem(storageKey);
        setUser(stored ? (JSON.parse(stored) as User) : null);
      }

      if (active) setLoading(false);
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured && user) {
      window.localStorage.setItem(storageKey, JSON.stringify(user));
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      setUser,
      async signIn(email: string, password: string) {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const sessionUser = data.user;
          setUser({
            id: sessionUser.id,
            email: sessionUser.email ?? email,
            name: sessionUser.user_metadata.name ?? email.split("@")[0],
            role: roleFromEmail(sessionUser.email ?? email) === "admin" ? "admin" : (sessionUser.user_metadata.role as Role) ?? "user",
            onboardingComplete: Boolean(sessionUser.user_metadata.onboardingComplete)
          });
        } else {
          setUser({
            id: `local-${email}`,
            email,
            name: email.split("@")[0],
            role: roleFromEmail(email),
            onboardingComplete: true
          });
        }
        router.push("/dashboard");
      },
      async signUp(name: string, email: string, password: string) {
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name, role: roleFromEmail(email), onboardingComplete: false } }
          });
          if (error) throw error;
          if (data.user) {
            setUser({
              id: data.user.id,
              email,
              name,
              role: roleFromEmail(email),
              onboardingComplete: false
            });
          }
        } else {
          setUser({
            id: `local-${email}`,
            email,
            name,
            role: roleFromEmail(email),
            onboardingComplete: false
          });
        }
        router.push("/onboarding");
      },
      async logout() {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut();
        }
        window.localStorage.removeItem(storageKey);
        setUser(null);
        router.push("/");
      }
    }),
    [loading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
