import Link from "next/link";
import { safetyDisclaimer } from "@/lib/safety";

export function Footer() {
  return (
    <footer className="border-t bg-background/80">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-foreground">NileFit AI is free for every registered user.</p>
          <div className="flex gap-4">
            <Link href="/features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="/about" className="hover:text-foreground">
              Safety
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
        <p className="max-w-5xl text-xs leading-6">{safetyDisclaimer}</p>
      </div>
    </footer>
  );
}
