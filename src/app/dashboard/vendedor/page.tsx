
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a simple redirect to the new dynamic dashboard structure.
// The main logic is handled in /dashboard/[role]/page.tsx
export default function VendedorDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/vendedor');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <p className="text-foreground text-xl">Redirecionando para o painel de vendedor...</p>
    </div>
  );
}
