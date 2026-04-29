import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  amount: number;
  /** previous-period amount used to compute delta % */
  previous?: number;
  hint?: string;
  tone?: "default" | "success" | "danger" | "info";
  className?: string;
  size?: "m" | "l";
}

export function MetricCard({
  label,
  amount,
  previous,
  hint,
  tone = "default",
  className,
  size = "m",
}: MetricCardProps) {
  const delta =
    previous !== undefined && previous !== 0
      ? ((amount - previous) / Math.abs(previous)) * 100
      : undefined;
  const deltaUp = delta !== undefined && delta >= 0;
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-danger",
    info: "text-info",
  }[tone];

  return (
    <Card className={cn("flex flex-col gap-1", className)}>
      <span className="text-body-s text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular",
          size === "l" ? "text-display-l" : "text-amount-l",
          toneClass
        )}
      >
        {formatKRW(amount)}
      </span>
      {(delta !== undefined || hint) && (
        <div className="flex items-center gap-1.5 text-caption">
          {delta !== undefined ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                deltaUp ? "text-success" : "text-danger"
              )}
            >
              {deltaUp ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {Math.abs(delta).toFixed(1)}%
            </span>
          ) : null}
          {hint ? (
            <span className="text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      )}
    </Card>
  );
}
