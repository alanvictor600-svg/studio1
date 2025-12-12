"use client";

import { useSearchParams } from "next/navigation";

export default function Client404() {
  const sp = useSearchParams();
  const from = sp.get("from");

  return (
    <main style={{ padding: 24 }}>
      <h1>404</h1>
      <p>Página não encontrada.</p>
      {from ? <p>Você veio de: {from}</p> : null}
    </main>
  );
}
