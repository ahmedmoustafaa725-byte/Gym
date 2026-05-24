"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <ShieldAlert className="mb-3 h-8 w-8 text-accent" />
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>This area is role-protected. Use an admin account to manage platform content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}
