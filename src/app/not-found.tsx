"use client";

import { Suspense } from "react";
import Client404 from "@/app/404/Client";

// This is the Next.js convention for a custom 404 page.
// It wraps a client component in Suspense to allow the use of client-side hooks like useSearchParams
// without breaking the server build.
export default function NotFound() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Client404 />
    </Suspense>
  );
}
