
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
    // Fake props for demonstration. In a real app, these would come from state or context.
    const fakeProps = {
      draws: [],
      winningTickets: [],
      rankedTickets: [],
      allTickets: [],
      adminHistory: [],
      financialReport: {
        totalRevenue: 0,
        sellerCommission: 0,
        ownerCommission: 0,
        prizePool: 0,
        clientRevenue: 0,
        sellerRevenue: 0,
        clientTicketCount: 0,
        sellerTicketCount: 0,
      },
      lotteryConfig: {
        ticketPrice: 2,
        sellerCommissionPercentage: 10,
        ownerCommissionPercentage: 5,
        clientSalesCommissionToOwnerPercentage: 10,
      },
       creditRequestConfig: {
        whatsappNumber: '',
        pixKey: '',
      },
      onAddDraw: () => {},
      onStartNewLottery: async () => {},
      onSaveLotteryConfig: async () => {},
      onSaveCreditRequestConfig: async () => {},
      onOpenCreditDialog: () => {},
      onOpenViewUser: () => {},
      hasWinningTickets: false,
    };

    switch (section) {
      case "configuracoes":
        return <SettingsSection {...fakeProps} />;
      case "cadastrar-sorteio":
        return <NewDrawSection {...fakeProps} />;
      case "controles-loteria":
        return <ControlsSection {...fakeProps} />;
      case "historico-sorteios":
        return <DrawHistorySection {...fakeProps} />;
      case "bilhetes-premiados":
        return <WinningTicketsSection {...fakeProps} />;
      case "relatorios":
        return <ReportsSection {...fakeProps} />;
      case "ranking-ciclo":
        return <CycleRankingSection {...fakeProps} />;
      default:
        return <SettingsSection {...fakeProps} />;
    }
  }

  return (
    <div style={{ color: "white" }}>
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
