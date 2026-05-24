"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth-context";
import { AppStateProvider } from "@/lib/app-state";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
