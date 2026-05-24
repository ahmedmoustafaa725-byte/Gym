import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-10 w-full rounded-md border bg-background/70 px-3 text-sm text-foreground placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
