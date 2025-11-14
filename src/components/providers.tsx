
"use client";

import { Suspense } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, AuthProviderContent } from '@/context/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Suspense>
                    <AuthProviderContent>
                        {children}
                    </AuthProviderContent>
                </Suspense>
            </AuthProvider>
        </ThemeProvider>
    );
}
