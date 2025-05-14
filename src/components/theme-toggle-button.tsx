
"use client";

import type { FC } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

export const ThemeToggleButton: FC = () => {
  const { theme, toggleTheme } = useTheme();

  // Determine what the *next* theme will be to show the correct icon
  // Or, more simply, show the icon for the *opposite* of the current displayed theme
  let isCurrentlyDark = false;
  if (theme === 'system') {
    isCurrentlyDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isCurrentlyDark = theme === 'dark';
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isCurrentlyDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="shadow-lg rounded-full"
    >
      {isCurrentlyDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
};
