"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dumbbell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { isMockMode } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "login" && isMockMode ? "demo@nilefit.app" : "");
  const [password, setPassword] = useState(mode === "login" && isMockMode ? "demo-password" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(name || email.split("@")[0], email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
            <Dumbbell className="h-5 w-5" />
          </div>
          <CardTitle>{mode === "login" ? "Welcome back" : "Create your free coach account"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Log in to your workouts, meals, calorie dashboard, and progress."
              : "Every feature is free: workouts, meals, chat logging, progress, and recommendations."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="grid gap-2 text-sm font-medium">
                Name
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name, e.g. Ahmed Mohamed" />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-medium">
              Email
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                type="password"
                minLength={8}
                required
              />
            </label>
            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
            {isMockMode ? (
              <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                Demo mode is active because mock auth is enabled or Supabase env vars are empty. Use any email/password; include "admin" in the email for admin access.
              </p>
            ) : null}
            <Button className="w-full" size="lg" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "login" ? "Login" : "Create free account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <Link className="font-semibold text-primary" href={mode === "login" ? "/register" : "/login"}>
              {mode === "login" ? "Register free" : "Login"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
