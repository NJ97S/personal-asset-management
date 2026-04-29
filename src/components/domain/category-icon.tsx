import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface CategoryIconProps {
  icon?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  rounded?: "md" | "full";
  className?: string;
  fallback?: keyof typeof LucideIcons;
}

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4" },
  md: { box: "h-10 w-10", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12", icon: "h-6 w-6" },
} as const;

function pickIcon(name?: string | null, fallback: keyof typeof LucideIcons = "Tag") {
  const lib = LucideIcons as unknown as Record<string, LucideIcon>;
  if (name && lib[name]) return lib[name];
  return lib[fallback] ?? lib.Tag;
}

export function CategoryIcon({
  icon,
  color,
  size = "md",
  rounded = "md",
  className,
  fallback = "Tag",
}: CategoryIconProps) {
  const Icon = pickIcon(icon, fallback);
  const { box, icon: iconSize } = sizeMap[size];
  const tone = color ?? "hsl(var(--brand-green))";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        box,
        rounded === "full" ? "rounded-full" : "rounded-md",
        className
      )}
      style={{ backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)` }}
      aria-hidden
    >
      <Icon className={iconSize} style={{ color: tone }} strokeWidth={1.8} />
    </span>
  );
}
