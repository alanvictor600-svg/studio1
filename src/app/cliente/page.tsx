
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a simple redirect to the new dynamic dashboard structure.
export default function ClienteRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/cliente');
  }, [router]);

  return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Redirecionando para sua área...</p>
      </div>
  );
}

    