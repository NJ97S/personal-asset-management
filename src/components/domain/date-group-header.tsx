import { cn } from "@/lib/utils";
import { formatMonthDay, formatKRW } from "@/lib/utils";

interface DateGroupHeaderProps {
  date: Date | string;
  income?: number;
  expense?: number;
  sticky?: boolean;
  className?: string;
}

export function DateGroupHeader({
  date,
  income,
  expense,
  sticky = true,
  className,
}: DateGroupHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between bg-background/95 px-4 py-2 backdrop-blur",
        sticky && "sticky top-14 z-10",
        className
      )}
    >
      <span className="text-body-s font-semibold text-muted-foreground">
        {formatMonthDay(date)}
      </span>
      <div className="flex items-center gap-3 tabular text-body-s">
        {income !== undefined && income !== 0 ? (
          <span className="text-success">+{formatKRW(income)}</span>
        ) : null}
        {expense !== undefined && expense !== 0 ? (
          <span className="text-danger">-{formatKRW(expense)}</span>
        ) : null}
      </div>
    </div>
  );
}
