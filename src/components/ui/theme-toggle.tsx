"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="border-foreground/20"
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-indigo-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
