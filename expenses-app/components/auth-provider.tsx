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
  accessToken: string | null;
  user: unknown;
  status: AuthStatus;
  error: string | null;
  login: (accessToken: string) => Promise<boolean>;
  logout: () => void;
  authFetch: typeof fetch;
};

const ACCESS_TOKEN_STORAGE_KEY = "expenses.accessToken";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<unknown>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const verifyToken = useCallback(async (token: string): Promise<boolean> => {
    setStatus("checking");
    setError(null);

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
        setError(parseAuthError(data, res.status));
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        return false;
      }

      setAccessToken(token);
      setUser(data);
      setStatus("authenticated");
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      return true;
    } catch (err) {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
      setError(err instanceof Error ? err.message : "Could not verify session");
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      return false;
    }
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    void verifyToken(token);
  }, [verifyToken]);

  const login = useCallback(
    async (token: string) => {
      const trimmed = token.trim();
      if (!trimmed) {
        setError("Access token is required");
        return false;
      }

      return verifyToken(trimmed);
    },
    [verifyToken]
  );

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    setError(null);
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }, []);

  const authFetch = useCallback<typeof fetch>(
    (input, init) => {
      const headers = new Headers(init?.headers);
      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      return fetch(input, {
        ...init,
        headers,
      });
    },
    [accessToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      status,
      error,
      login,
      logout,
      authFetch,
    }),
    [accessToken, user, status, error, login, logout, authFetch]
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
