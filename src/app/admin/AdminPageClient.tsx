"use client";

import { Suspense } from 'react';
import AdminLayoutContent from './AdminLayoutContent';
import type { AdminSection } from './AdminClient';
import AdminClient from './AdminClient';
import { useSearchParams } from 'next/navigation';

const VALID_SECTIONS: Set<AdminSection> = new Set([
  'configuracoes', 
  'cadastrar-sorteio', 
  'controles-loteria', 
  'historico-sorteios', 
  'bilhetes-premiados', 
  'relatorios', 
  'ranking-ciclo'
]);

function toSection(value: string | null): AdminSection {
  return VALID_SECTIONS.has(value as AdminSection) ? (value as AdminSection) : "configuracoes";
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const sectionQuery = searchParams.get('section');
  const section = toSection(sectionQuery);
  
  return (
    <AdminLayoutContent activeSection={section}>
      <Suspense fallback={<div className="text-center p-10 text-white">Carregando seção...</div>}>
        <AdminClient initialSection={section} />
      </Suspense>
    </AdminLayoutContent>
  );
}

export default function AdminPageClient() {
  return (
    <Suspense fallback={<div className="text-center p-10 text-white">Carregando...</div>}>
      <AdminPageContent />
    </Suspense>
  )
}
