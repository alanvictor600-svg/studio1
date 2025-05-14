
"use client";

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  attribute?: "class";
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean; 
}

interface ThemeProviderState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  resolvedTheme?: string; 
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
  storageKey = 'ui-theme',
  attribute = "class",
  enableSystem = true,
  // disableTransitionOnChange is accepted but not explicitly used in this simplified version
  ...props
}) => {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || defaultTheme;
    }
    return defaultTheme;
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
        if (theme === 'system' && enableSystem) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    }
    // For SSR, if theme is system, we can't know, default to 'light' or 'defaultTheme' if not system
    return theme === 'system' ? 'light' : theme; 
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    let effectiveTheme = theme;
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    }
    setResolvedTheme(effectiveTheme);

    root.classList.remove('light', 'dark');
    if (attribute === "class") {
        root.classList.add(effectiveTheme);
    }
    // Persist the user's explicit choice (light, dark, or system) in localStorage
    // This is done in setTheme now, but initial load also needs to be correct.
  }, [theme, storageKey, enableSystem, attribute]);


  useEffect(() => {
    if (theme === 'system' && enableSystem && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newSystemTheme); // Update resolved theme
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (attribute === "class") {
            root.classList.add(newSystemTheme);
        }
      };
      // Initial check
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, enableSystem, attribute]);


  const setTheme = (newTheme: string) => {
     if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
     }
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    // Use resolvedTheme for toggling logic to ensure it flips the *actual* current theme
    const currentActualTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    const nextTheme = currentActualTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme); // User intends to switch to light or dark explicitly
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
