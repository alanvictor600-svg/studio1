
import { Suspense } from 'react';
import AdminLayoutContent from './AdminLayoutContent';
import type { AdminSection } from './AdminClient';
import AdminClient from './AdminClient';

// Tipo para as props da página no Next.js 15, que trata searchParams como uma Promise
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

function toSection(value: string | string[] | undefined): AdminSection {
  const v = (Array.isArray(value) ? value[0] : value) ?? "configuracoes";
  return VALID_SECTIONS.has(v as AdminSection) ? (v as AdminSection) : "configuracoes";
}

// A página agora é um Server Component `async` para lidar com searchParams
export default function AdminPage({ searchParams }: PageProps) {
  const section = toSection(searchParams?.['section']);
  
  return (
    <AdminLayoutContent activeSection={section}>
      <Suspense fallback={<div className="text-center p-10 text-white">Carregando seção...</div>}>
        <AdminClient initialSection={section} />
      </Suspense>
    </AdminLayoutContent>
  );
}
