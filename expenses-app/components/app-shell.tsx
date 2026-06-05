"use client";

import { useEffect, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, status } = useAuth();
  const checking = status === "checking";

  useEffect(() => {
    if (status !== "unauthenticated") return;

    const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.location.replace(
      `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    );
  }, [status]);

  if (checking || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Spinner className="size-5" />
          {checking ? "Checking session..." : "Redirecting to sign in..."}
        </div>
      </div>
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
              onClick={() => void logout()}
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
