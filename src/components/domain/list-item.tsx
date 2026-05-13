import * as React from "react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { AmountDisplay } from "./amount-display";

interface ListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: { name?: string | null; color?: string | null };
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  amount?: number | string;
  amountVariant?: "income" | "expense" | "neutral";
  meta?: React.ReactNode;
  asAction?: boolean;
}

export function ListItem({
  icon,
  title,
  subtitle,
  amount,
  amountVariant = "neutral",
  meta,
  asAction,
  className,
  ...rest
}: ListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        asAction &&
          "cursor-pointer transition-colors hover:bg-muted/50 active:scale-[0.99]",
        className
      )}
      {...rest}
    >
      <CategoryIcon icon={icon?.name} color={icon?.color} size="md" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-body-l font-medium text-foreground">
          {title}
        </div>
        {subtitle ? (
          <div className="truncate text-body-s text-muted-foreground">
            {subtitle}
          </div>
        ) : null}
      </div>
      {(amount !== undefined || meta) && (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {amount !== undefined ? (
            <AmountDisplay amount={amount} variant={amountVariant} size="m" />
          ) : null}
          {meta ? (
            <div className="text-caption text-muted-foreground/80">{meta}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
