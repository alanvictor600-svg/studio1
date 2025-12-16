
"use client";

import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

export type AdminSection = 
  | "configuracoes" 
  | "cadastrar-sorteio" 
  | "controles-loteria" 
  | "historico-sorteios" 
  | "bilhetes-premiados" 
  | "relatorios" 
  | "ranking-ciclo";

function AdminClientContent({ initialSection }: { initialSection: AdminSection }) {
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>(initialSection);

  function go(next: AdminSection) {
    setSection(next);
    // We use router.replace to avoid adding to the browser's history stack for simple UI changes.
    router.replace(`/admin?section=${next}`);
  }
  
  // A simple demonstration of the Server/Client architecture.
  // The full implementation would be re-integrated here, but without
  // the need for `useSearchParams` as the initial state is provided by the server.
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh", color: "white" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #4A5568" }}>
        <h2>Painel (Exemplo)</h2>

        <nav style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <button onClick={() => go("configuracoes")} aria-current={section === "configuracoes"}>
            Configurações
          </button>
          <button onClick={() => go("cadastrar-sorteio")} aria-current={section === "cadastrar-sorteio"}>
            Cadastrar Sorteio
          </button>
          <button onClick={() => go("controles-loteria")} aria-current={section === "controles-loteria"}>
            Controles
          </button>
           <button onClick={() => go("ranking-ciclo")} aria-current={section === "ranking-ciclo"}>
            Ranking do Ciclo
          </button>
        </nav>
      </aside>

      <main style={{ padding: 16 }}>
        <p className="text-lg font-semibold">Seção Ativa: <span className="text-primary font-bold">{section}</span></p>
        <p className="text-muted-foreground mt-2">O conteúdo completo para esta seção seria renderizado aqui.</p>
        
        {section === "configuracoes" && <div className="mt-4 p-4 border rounded-lg">Conteúdo de Configurações</div>}
        {section === "cadastrar-sorteio" && <div className="mt-4 p-4 border rounded-lg">Conteúdo para Cadastrar Sorteio</div>}
        {section === "controles-loteria" && <div className="mt-4 p-4 border rounded-lg">Conteúdo dos Controles</div>}
        {section === "ranking-ciclo" && <div className="mt-4 p-4 border rounded-lg">Conteúdo do Ranking do Ciclo</div>}
      </main>
    </div>
  );
}

export default function AdminClient({ initialSection }: { initialSection: AdminSection }) {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AdminClientContent initialSection={initialSection} />
        </Suspense>
    );
}
