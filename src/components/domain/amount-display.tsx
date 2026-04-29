import { cn } from "@/lib/utils";
import { formatKRW } from "@/lib/utils";

interface AmountDisplayProps {
  amount: number | string;
  /** "income" | "expense" — drives sign and color */
  variant?: "income" | "expense" | "neutral";
  size?: "m" | "l";
  showSign?: boolean;
  className?: string;
}

export function AmountDisplay({
  amount,
  variant = "neutral",
  size = "m",
  showSign,
  className,
}: AmountDisplayProps) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const signed =
    variant === "income"
      ? Math.abs(n)
      : variant === "expense"
        ? -Math.abs(n)
        : n;
  const color =
    variant === "income"
      ? "text-success"
      : variant === "expense"
        ? "text-danger"
        : "text-foreground";
  return (
    <span
      className={cn(
        "tabular",
        size === "l" ? "text-amount-l" : "text-amount-m",
        color,
        className
      )}
    >
      {formatKRW(signed, { sign: showSign ?? variant !== "neutral" })}
    </span>
  );
}
