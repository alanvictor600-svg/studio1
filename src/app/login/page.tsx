
import LoginClient from "./LoginClient";
import { Suspense } from 'react';

// This component remains a Server Component to facilitate reading searchParams
// in the future if needed, but delegates all logic to the client component.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Carregando...</div>}>
      <LoginClient />
    </Suspense>
  );
}
