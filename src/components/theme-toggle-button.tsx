
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const ariaLabel = mounted ? (theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro') : 'Mudar tema';

  if (!mounted) {
    return (
        <Button
            variant="secondary"
            size="icon"
            disabled={true}
            aria-label={ariaLabel}
            className="shadow-lg rounded-full"
        >
            <Sun className="h-5 w-5" />
        </Button>
    );
  }


  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      className="shadow-lg rounded-full"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
