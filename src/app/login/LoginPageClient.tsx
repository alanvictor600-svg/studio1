"use client";

import LoginClient from "./LoginClient";
import { Suspense } from 'react';

// Este componente permanece um Server Component para facilitar a leitura de searchParams.
export default function LoginPageClient() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Carregando...</div>}>
      <LoginClient />
    </Suspense>
  );
}
