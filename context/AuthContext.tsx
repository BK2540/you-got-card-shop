"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/lib/auth-jwt";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthResult = {
  ok: boolean;
  error?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = (await res.json()) as { user?: AuthUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      try {
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const data = (await res.json()) as {
          user?: AuthUser;
          error?: string;
        };

        if (!res.ok || !data.user) {
          return { ok: false, error: data.error || "Sign in failed." };
        }

        setUser(data.user);
        return { ok: true };
      } catch {
        return { ok: false, error: "Sign in failed." };
      }
    },
    [],
  );

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const data = (await res.json()) as {
          user?: AuthUser;
          error?: string;
        };

        if (!res.ok || !data.user) {
          return { ok: false, error: data.error || "Sign up failed." };
        }

        setUser(data.user);
        return { ok: true };
      } catch {
        return { ok: false, error: "Sign up failed." };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
