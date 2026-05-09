"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";

const themes = ["light", "dark", "system"] as const;
type Theme = (typeof themes)[number];

const icons: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

const labels: Record<Theme, string> = {
  light: "라이트",
  dark: "다크",
  system: "시스템",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="h-10 w-10" disabled />;
  }

  const current = (themes.includes(theme as Theme) ? theme : "system") as Theme;

  function cycle() {
    const idx = themes.indexOf(current);
    setTheme(themes[(idx + 1) % themes.length]);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10"
      onClick={cycle}
      aria-label="테마 변경"
    >
      {icons[current]}
      <span className="sr-only">{labels[current]}</span>
    </Button>
  );
}
