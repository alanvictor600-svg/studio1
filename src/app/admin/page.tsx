// src/app/admin/page.tsx
import AdminClient from "./AdminClient";
import type { AdminSection } from './AdminClient';

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
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

export default function AdminPage({ searchParams }: PageProps) {
  const activeSection = toSection(getParam(searchParams, "section"));
  return <AdminClient activeSection={activeSection} />;
}
