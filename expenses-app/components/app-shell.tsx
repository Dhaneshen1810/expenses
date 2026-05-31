"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const { error, login, logout, status } = useAuth();
  const checking = status === "checking";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await login(tokenInput);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Spinner className="size-5" />
          Checking session...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={(e) => void handleLogin(e)}
          className="grid w-full max-w-sm gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste an access token from the auth service.
            </p>
          </div>

          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Access token"
            autoComplete="off"
          />
          <Button type="submit">Continue</Button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="md:pl-56">
        <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-12">
          <div className="mb-6 flex items-center gap-4 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Expenses</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              aria-label="Sign out"
              className="ml-auto text-muted-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
