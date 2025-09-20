
"use client";

import { useEffect, useState, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { Ticket } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { SellerDashboard } from '@/components/seller-dashboard';
import { TicketList } from '@/components/ticket-list';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingBag } from 'lucide-react';
import { useDashboard } from '@/context/dashboard-context';


export default function DashboardPage() {
  const params = useParams();
  const { role } = params as { role: 'cliente' | 'vendedor' };
  const { currentUser, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
      cart,
      setCart,
      isSubmitting,
      lotteryConfig,
      userTickets,
      allDraws,
      isLotteryPaused,
      isDataLoading,
  } = useDashboard();
  
  const [activeTab, setActiveTab] = useState(role === 'cliente' ? 'aposta' : 'vendas');
  const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);
  

  // Validate the role from the URL
  useEffect(() => {
    if (role !== 'cliente' && role !== 'vendedor') {
      notFound();
    }
  }, [role]);
  
  // Effect to handle re-betting logic
  useEffect(() => {
    if (ticketToRebet) {
      setCart(prevCart => [...prevCart, ticketToRebet]);
      setTicketToRebet(null); // Reset after adding to cart
      setActiveTab('aposta');
       toast({
        title: "Bilhete adicionado ao carrinho!",
        description: "A aposta selecionada está pronta para ser comprada novamente.",
        duration: 4000
      });
    }
  }, [ticketToRebet, toast, setCart]);


  const processedUserTickets = useMemo(() => updateTicketStatusesBasedOnDraws(userTickets, allDraws), [userTickets, allDraws]);

  if (isAuthLoading || isDataLoading) {
    return <div className="text-center p-10 text-white">Carregando dados do painel...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    router.replace('/login?redirect=/dashboard/' + role);
    return <div className="text-center p-10 text-white">Você precisa estar logado para ver esta página. Redirecionando...</div>;
  }
  
  if (currentUser.role !== role) {
    // This can happen briefly if a user's role changes.
    // The layout's useEffect will handle redirection, so we can just show a loading state.
    return <div className="text-center p-10 text-white">Verificando permissões...</div>;
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    // The onSnapshot listener in the context will handle the update automatically.
  };

  const handleRebet = (numbers: number[]) => {
    setTicketToRebet(numbers);
  };
  
  const clientTab = role === 'cliente' ? activeTab : 'vendas';
  
  return (
    <>
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center">
            {role === 'cliente' ? 'Bem-vindo, Apostador!' : 'Painel do Vendedor'}
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             {role === 'cliente' ? 'Sua sorte começa aqui. Escolha seus números e boa sorte!' : 'Gerencie suas vendas e acompanhe seus resultados.'}
          </p>
      </header>
      
      {role === 'cliente' && (
        <Tabs value={clientTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto mb-8">
                <TabsTrigger value="aposta" className="py-3 text-base">
                    <TicketIcon className="mr-2 h-5 w-5" /> Fazer Aposta
                </TabsTrigger>
                <TabsTrigger value="bilhetes" className="py-3 text-base">
                    <ShoppingBag className="mr-2 h-5 w-5" /> Meus Bilhetes
                </TabsTrigger>
            </TabsList>
            <TabsContent value="aposta">
                 <TicketSelectionForm
                    isLotteryPaused={isLotteryPaused}
                    cart={cart}
                    onCartChange={setCart}
                    isSubmitting={isSubmitting}
                />
            </TabsContent>
            <TabsContent value="bilhetes">
                 <section>
                    <h2 className="text-2xl font-bold text-center text-white mb-6">
                        Meus Bilhetes
                    </h2>
                    <TicketList tickets={processedUserTickets} draws={allDraws} onRebet={handleRebet} />
                </section>
            </TabsContent>
        </Tabs>
      )}

      {role === 'vendedor' && (
         <SellerDashboard 
            isLotteryPaused={isLotteryPaused}
            lotteryConfig={lotteryConfig}
            onTicketCreated={handleTicketCreated}
            userTickets={processedUserTickets}
            currentUser={currentUser}
            allDraws={allDraws}
         />
      )}
    </div>
    </>
  );
}
