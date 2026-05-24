"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut, Sparkles } from "lucide-react";
import { adminNavigation, appNavigation } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function NavLink({ href, label, icon: Icon, compact = false }: { href: string; label: string; icon: LucideIcon; compact?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-primary/10 text-primary",
        compact && "justify-center px-2"
      )}
      title={label}
    >
      <Icon className="h-4 w-4" />
      {!compact ? <span>{label}</span> : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const adminItems = user?.role === "admin" ? adminNavigation : [];
  const bottomItems = appNavigation.slice(0, 5);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r bg-background/80 p-4 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold">NileFit AI</span>
            <span className="text-xs text-muted-foreground">Free intelligent coaching</span>
          </span>
        </Link>

        <nav className="space-y-1">
          {appNavigation.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {adminItems.length ? (
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Admin</p>
            <nav className="space-y-1">
              {adminItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
        ) : null}

        <div className="absolute bottom-4 left-4 right-4 rounded-lg border bg-card p-3">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <div className="mt-3 flex items-center justify-between">
            <ThemeToggle />
            <Button size="sm" variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/75 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            NileFit AI
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button size="icon" variant="ghost" aria-label="Logout" title="Logout" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/90 p-2 backdrop-blur-xl lg:hidden">
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} compact />
        ))}
      </nav>
    </div>
  );
}
