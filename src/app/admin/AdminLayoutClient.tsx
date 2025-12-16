"use client";

import { SidebarProvider } from '@/components/ui/sidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    // This layout is now just a simple wrapper for the SidebarProvider.
    // All logic is handled by the page and AdminLayoutContent.
    return (
        <SidebarProvider>
            {children}
        </SidebarProvider>
    );
}
