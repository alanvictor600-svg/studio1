"use client";

// Server Component Wrapper
import CadastroClient from "./CadastroClient";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function getParam(sp: URLSearchParams | null, key: string) {
  if (!sp) return undefined;
  return sp.get(key) || undefined;
}

function CadastrarPageContent() {
  const searchParams = useSearchParams();
  const roleFromQuery = getParam(searchParams, "role");
  const initialRole = roleFromQuery === 'cliente' || roleFromQuery === 'vendedor' ? roleFromQuery : null;
  return <CadastroClient initialRole={initialRole} />;
}

export default function CadastrarPageClient() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Carregando...</div>}>
       <CadastrarPageContent />
    </Suspense>
  )
}
