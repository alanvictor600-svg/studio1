
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is obsolete and now redirects to the main seller dashboard.
export default function SellerReportsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/vendedor');
    }, [router]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <p className="text-foreground text-xl">Redirecionando...</p>
        </div>
    );
};
