
import { Suspense } from 'react';
import AdminLayoutContent from './AdminLayoutContent';
import type { AdminSection } from './AdminClient';
import AdminClient from './AdminClient';

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

const VALID_SECTIONS: Set<AdminSection> = new Set([
  'configuracoes', 
  'cadastrar-sorteio', 
  'controles-loteria', 
  'historico-sorteios', 
  'bilhetes-premiados', 
  'relatorios', 
  'ranking-ciclo'
]);

function toSection(value: string | undefined): AdminSection {
  const v = (value ?? "configuracoes") as AdminSection;
  return VALID_SECTIONS.has(v) ? v : "configuracoes";
}

// This page remains a Server Component to read searchParams
export default function AdminPage({ searchParams }: PageProps) {
  const paramValue = searchParams?.['section'];
  const section = toSection(Array.isArray(paramValue) ? paramValue[0] : paramValue);
  
  return (
    <AdminLayoutContent activeSection={section}>
      <Suspense fallback={<div className="text-center p-10 text-white">Carregando seção...</div>}>
        <AdminClient initialSection={section} />
      </Suspense>
    </AdminLayoutContent>
  );
}
