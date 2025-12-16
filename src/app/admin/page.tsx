
import { Suspense } from 'react';
import AdminLayoutContent from './AdminLayoutContent';
import type { AdminSection } from './AdminClient';
import AdminClient from './AdminClient';

const VALID_SECTIONS: Set<AdminSection> = new Set([
  'configuracoes', 
  'cadastrar-sorteio', 
  'controles-loteria', 
  'historico-sorteios', 
  'bilhetes-premiados', 
  'relatorios', 
  'ranking-ciclo'
]);

function toSection(value: string | string[] | undefined): AdminSection {
  const v = (Array.isArray(value) ? value[0] : value) ?? "configuracoes";
  return VALID_SECTIONS.has(v as AdminSection) ? (v as AdminSection) : "configuracoes";
}

// A página agora é um Server Component `async` que lida corretamente com searchParams.
export default async function AdminPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined }}) {
  const section = toSection(searchParams?.['section']);
  
  return (
    <AdminLayoutContent activeSection={section}>
      <Suspense fallback={<div className="text-center p-10 text-white">Carregando seção...</div>}>
        <AdminClient initialSection={section} />
      </Suspense>
    </AdminLayoutContent>
  );
}
