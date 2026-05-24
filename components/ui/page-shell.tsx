import { cn } from "@/lib/cn";

export function PageShell({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-7xl space-y-6 p-4 pb-24 sm:p-6 lg:p-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
