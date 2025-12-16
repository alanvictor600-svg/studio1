
// Server Component Wrapper
import CadastroClient from "./CadastroClient";

function getParam(sp: { [key: string]: string | string[] | undefined } | undefined, key: string) {
  if (!sp) return undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function CadastrarPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const roleFromQuery = getParam(searchParams, "role");
  const initialRole = roleFromQuery === 'cliente' || roleFromQuery === 'vendedor' ? roleFromQuery : null;
  return <CadastroClient initialRole={initialRole} />;
}
