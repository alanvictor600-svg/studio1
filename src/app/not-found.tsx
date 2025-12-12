"use client";

import { Suspense } from "react";
import { NotFoundClient } from "@/components/not-found-client";

// This is the Next.js convention for a custom 404 page.
// It wraps a client component in Suspense to allow the use of client-side hooks like useSearchParams
// without breaking the server build.
export default function NotFound() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NotFoundClient />
    </Suspense>
  );
}
