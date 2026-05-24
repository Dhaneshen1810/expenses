"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/expenses",
    label: "Expenses",
    icon: Wallet,
    color: "text-[oklch(0.72_0.14_145)]",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "text-[oklch(0.72_0.12_250)]",
  },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-card p-6 transition-transform duration-300 ease-in-out",
          "md:w-56 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Expenses</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", item.color)} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
