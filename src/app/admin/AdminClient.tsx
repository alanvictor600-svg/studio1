
"use client";

import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { SettingsSection } from "@/components/admin/sections/SettingsSection";
import { NewDrawSection } from "@/components/admin/sections/NewDrawSection";
import { DrawHistorySection } from "@/components/admin/sections/DrawHistorySection";
import { WinningTicketsSection } from "@/components/admin/sections/WinningTicketsSection";
import { ReportsSection } from "@/components/admin/sections/ReportsSection";
import { ControlsSection } from "@/components/admin/sections/ControlsSection";
import { CycleRankingSection } from "@/components/admin/sections/CycleRankingSection";

export type AdminSection = 
  | "configuracoes" 
  | "cadastrar-sorteio" 
  | "controles-loteria" 
  | "historico-sorteios" 
  | "bilhetes-premiados" 
  | "relatorios" 
  | "ranking-ciclo";

// Este componente agora recebe a seção inicial como uma prop
function AdminClientContent({ initialSection }: { initialSection: AdminSection }) {
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>(initialSection);

  // Esta função não é mais necessária para a renderização inicial, mas pode ser usada para navegação interna
  function navigate(next: AdminSection) {
    setSection(next);
    // Usamos router.push (ou replace) para atualizar a URL se necessário, sem recarregar a página
    router.push(`/admin?section=${next}`);
  }

  // Renderiza o conteúdo baseado na seção ativa
  const renderSection = () => {
    switch (section) {
      case "configuracoes":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo de Configurações</div>; // Placeholder
      case "cadastrar-sorteio":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo para Cadastrar Sorteio</div>; // Placeholder
      case "controles-loteria":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo dos Controles</div>; // Placeholder
      case "historico-sorteios":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo do Histórico de Sorteios</div>; // Placeholder
      case "bilhetes-premiados":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo de Bilhetes Premiados</div>; // Placeholder
      case "relatorios":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo de Relatórios</div>; // Placeholder
      case "ranking-ciclo":
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo do Ranking do Ciclo</div>; // Placeholder
      default:
        return <div className="mt-4 p-4 border rounded-lg">Conteúdo Padrão</div>;
    }
  }

  return (
    <div style={{ color: "white" }}>
      <p className="text-lg font-semibold">Seção Ativa: <span className="text-primary font-bold">{section}</span></p>
      <p className="text-muted-foreground mt-2">O conteúdo completo para esta seção seria renderizado aqui.</p>
      {renderSection()}
    </div>
  );
}

// O componente principal agora apenas envolve o Suspense
export default function AdminClient({ initialSection }: { initialSection: AdminSection }) {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AdminClientContent initialSection={initialSection} />
        </Suspense>
    );
}
