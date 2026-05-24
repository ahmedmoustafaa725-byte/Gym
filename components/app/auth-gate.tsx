"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-6">
          <Dumbbell className="mb-4 h-8 w-8 text-primary" />
          <Skeleton className="mb-3 h-5 w-44" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return children;
}
