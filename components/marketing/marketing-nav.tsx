import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          NileFit AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Login
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild>
            <Link href="/register">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
