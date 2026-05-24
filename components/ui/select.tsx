import * as React from "react";
import { cn } from "@/lib/cn";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("focus-ring h-10 w-full rounded-md border bg-background/70 px-3 text-sm text-foreground", className)}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = "Select";
