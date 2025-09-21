
"use client";

import type { FC } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export const ThemeToggleButton: FC = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Avoid rendering the button content on the server to prevent hydration mismatch
  if (!isMounted) {
    return (
      <Button
        variant="secondary"
        size="icon"
        disabled
        className="shadow-lg rounded-full"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }
  
  const isCurrentlyDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="secondary"
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
