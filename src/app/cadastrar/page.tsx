// Server Component Wrapper
import CadastroClient from "./CadastroClient";

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

function getParam(sp: PageProps["searchParams"], key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

export default function CadastrarPage({ searchParams }: PageProps) {
  const roleFromQuery = getParam(searchParams, "role");
  const initialRole = roleFromQuery === 'cliente' || roleFromQuery === 'vendedor' ? roleFromQuery : null;
  return <CadastroClient initialRole={initialRole} />;
}
