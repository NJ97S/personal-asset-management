import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const DefaultIllustration = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <circle cx="60" cy="60" r="56" fill="hsl(var(--brand-green) / 0.10)" />
    <path
      d="M36 64h48"
      stroke="hsl(var(--brand-green))"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M44 56c4 6 10 9 16 9s12-3 16-9"
      stroke="hsl(var(--brand-green))"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function EmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-sm flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-4">{illustration ?? <DefaultIllustration />}</div>
      <h2 className="mb-1 text-heading-m text-foreground">{title}</h2>
      {description ? (
        <p className="mb-6 text-body-m text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
