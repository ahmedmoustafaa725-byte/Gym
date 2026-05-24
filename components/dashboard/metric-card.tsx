"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";

export function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  progress,
  className,
  delay = 0
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtext: string;
  progress?: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={cn("h-full", className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{subtext}</p>
          {typeof progress === "number" ? <Progress className="mt-4" value={progress} /> : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
