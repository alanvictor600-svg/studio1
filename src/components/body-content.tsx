
"use client";

import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { PWALoader } from '@/components/pwa-loader';

export function BodyContent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <PWALoader />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
