
"use client";

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  attribute?: "class"; // Added to align with next-themes common prop name
  enableSystem?: boolean; // Added to align with next-themes common prop name
  disableTransitionOnChange?: boolean; // Added to align with next-themes
}

interface ThemeProviderState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void; // Added for convenience
  resolvedTheme?: string; // To know the actual applied theme when 'system' is chosen
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme', // Changed for clarity
  attribute = "class",
  enableSystem = true,
  ...props
}) => {
  const [theme, setThemeState] = useState<string>(
    () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(storageKey) || defaultTheme;
      }
      return defaultTheme;
    }
  );
  
  const [resolvedTheme, setResolvedTheme] = useState<string | undefined>(undefined);

  useEffect(() => {
    const root = window.document.documentElement;
    
    let effectiveTheme = theme;
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    }
    setResolvedTheme(effectiveTheme); // Store the actual theme being applied

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, theme); // Save the user's explicit choice (light, dark, or system)
    }
  }, [theme, storageKey, enableSystem]);


  // Listener for system theme changes if 'system' is selected
  useEffect(() => {
    if (theme === 'system' && enableSystem && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newSystemTheme);
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newSystemTheme);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, enableSystem]);


  const setTheme = (newTheme: string) => {
     if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
     }
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(currentResolvedTheme => {
      // Use resolvedTheme for toggling logic to ensure it flips the *actual* current theme
      const current = resolvedTheme === 'dark' ? 'light' : 'dark';
      return current === 'light' ? 'dark' : 'light';
    });
  };
  
  const value = {
    theme, // The user's preference (light, dark, system)
    setTheme,
    toggleTheme,
    resolvedTheme // The actual theme applied (light or dark)
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
