import { cn } from "@/lib/cn";

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all duration-700", indicatorClassName)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  label,
  caption,
  color = "hsl(var(--primary))"
}: {
  value: number;
  label: string;
  caption: string;
  color?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className="grid aspect-square min-h-32 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${safeValue * 3.6}deg, hsl(var(--muted)) 0deg)`
      }}
    >
      <div className="grid h-[78%] w-[78%] place-items-center rounded-full bg-card text-center">
        <div>
          <div className="text-2xl font-bold">{label}</div>
          <div className="text-xs text-muted-foreground">{caption}</div>
        </div>
      </div>
    </div>
  );
}
