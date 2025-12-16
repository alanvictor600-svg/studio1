
import LoginClient from "./LoginClient";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

function getParam(sp: PageProps["searchParams"], key: string) {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

export default function LoginPage({ searchParams }: PageProps) {
  const as = getParam(searchParams, "as"); // /login?as=admin
  const isAdmin = as === "admin";

  const redirect = getParam(searchParams, "redirect") ?? null;

  return <LoginClient isAdminLogin={isAdmin} redirectParam={redirect} />;
}
