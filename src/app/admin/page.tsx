// src/app/admin/page.tsx
import AdminClient from "./AdminClient";
import type { AdminSection } from './AdminClient';
import AdminLayoutContent from './AdminLayoutContent'; // Componente de cliente importado.

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

function getParam(sp: PageProps["searchParams"], key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

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

// A página agora é um Componente de Servidor que lê searchParams.
export default function AdminPage({ searchParams }: PageProps) {
  const section = toSection(getParam(searchParams, "section"));
  
  // A página renderiza o layout de conteúdo e o cliente da página,
  // passando a seção ativa para ambos.
  return (
    <AdminLayoutContent activeSection={section}>
      <AdminClient initialSection={section} />
    </AdminLayoutContent>
  );
}
