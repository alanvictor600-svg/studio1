"use client";

import type { FC } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export const ThemeToggleButton: FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Evita a renderização do botão no servidor para prevenir erros de hidratação
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
  const toggleTheme = () => setTheme(isCurrentlyDark ? 'light' : 'dark');

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
