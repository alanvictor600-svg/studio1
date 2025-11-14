
"use client";

import { Suspense } from 'react';

// Um componente simples que envolve os filhos em um Suspense.
// Isso é útil para agrupar lógica de Suspense em um único local.
export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
