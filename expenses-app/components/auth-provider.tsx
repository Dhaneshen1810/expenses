"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: unknown;
  status: AuthStatus;
  error: string | null;
  logout: () => Promise<void>;
  authFetch: typeof fetch;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setStatus("checking");
    setError(null);

    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setUser(null);
        setStatus("unauthenticated");
        setError(parseAuthError(data, res.status));
        return;
      }

      setUser(data);
      setStatus("authenticated");
    } catch (err) {
      setUser(null);
      setStatus("unauthenticated");
      setError(err instanceof Error ? err.message : "Could not verify session");
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const authFetch = useCallback<typeof fetch>(
    async (input, init) => {
      const res = await fetch(input, init);

      if (res.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        setError("Session expired");
      }

      return res;
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      logout,
      authFetch,
    }),
    [user, status, error, logout, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}

function parseAuthError(data: unknown, status: number): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }

  return `Auth check failed (${status})`;
}
