
"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { User, LotteryConfig, Ticket, Draw } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { SellerDashboard } from '@/components/seller-dashboard';
import { TicketList } from '@/components/ticket-list';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingBag, Repeat } from 'lucide-react';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

export default function DashboardPage() {
  const params = useParams();
  const { role } = params as { role: 'cliente' | 'vendedor' };
  
  const { currentUser, isLoading, isAuthenticated, updateCurrentUserCredits } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isLotteryPaused, setIsLotteryPaused] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [allDraws, setAllDraws] = useState<Draw[]>([]);
  const [activeTab, setActiveTab] = useState('aposta');
  const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);

  // Validate the role from the URL
  useEffect(() => {
    if (role !== 'cliente' && role !== 'vendedor') {
      notFound();
    }
  }, [role]);

  // Main data fetching and real-time listeners effect
  useEffect(() => {
    if (!currentUser || currentUser.role !== role) {
      if(!isLoading) setIsDataLoading(false);
      return;
    }
    
    setIsDataLoading(true);

    const configDocRef = doc(db, 'configs', 'global');
    const unsubscribeConfig = onSnapshot(configDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLotteryConfig({
          ticketPrice: data.ticketPrice || DEFAULT_LOTTERY_CONFIG.ticketPrice,
          sellerCommissionPercentage: data.sellerCommissionPercentage || DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage,
          ownerCommissionPercentage: data.ownerCommissionPercentage || DEFAULT_LOTTERY_CONFIG.ownerCommissionPercentage,
          clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || DEFAULT_LOTTERY_CONFIG.clientSalesCommissionToOwnerPercentage,
        });
      }
    }, (error) => {
      console.error("Error fetching lottery config: ", error);
      toast({ title: "Erro de Configuração", description: "Não foi possível carregar as configurações da loteria.", variant: "destructive" });
    });

    const drawsQuery = query(collection(db, 'draws'));
    const unsubscribeDraws = onSnapshot(drawsQuery, (drawsSnapshot) => {
      const drawsData = drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw));
      setAllDraws(drawsData);
      
      // Vendas são pausadas assim que o primeiro sorteio é cadastrado.
      setIsLotteryPaused(drawsData.length > 0);

    }, (error) => {
      console.error("Error fetching draws for pause check: ", error);
    });

    // OPTIMIZED QUERY: Fetch only tickets relevant to the user.
    const idField = role === 'cliente' ? 'buyerId' : 'sellerId';
    const ticketsQuery = query(
        collection(db, 'tickets'), 
        where(idField, '==', currentUser.id),
    );
      
    const unsubscribeTickets = onSnapshot(ticketsQuery, (ticketSnapshot) => {
        const userTicketsData = ticketSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Ticket))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setUserTickets(userTicketsData);
        setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching user tickets: ", error);
        toast({ title: "Erro ao Carregar Bilhetes", description: "Não foi possível carregar seus bilhetes.", variant: "destructive" });
        setIsDataLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeDraws();
      unsubscribeTickets();
    };

  }, [currentUser, role, toast, isLoading]);

  const processedUserTickets = updateTicketStatusesBasedOnDraws(userTickets, allDraws);

  if (isLoading || isDataLoading) {
    return <div className="text-center p-10">Carregando dados do painel...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    router.replace('/login?redirect=/dashboard/' + role);
    return <div className="text-center p-10">Você precisa estar logado para ver esta página. Redirecionando...</div>;
  }
  
  if (currentUser.role !== role) {
    return <div className="text-center p-10">Acesso negado. Você não tem permissão para ver este painel.</div>
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    // The onSnapshot listener will handle the update automatically.
    // This function can be kept for optimistic updates in the future if needed.
  };

  const handleRebet = (numbers: number[]) => {
    setTicketToRebet(numbers);
    setActiveTab('aposta');
    toast({
        title: "Números Prontos para Re-aposta!",
        description: "Os números do bilhete selecionado foram adicionados ao seu carrinho de apostas.",
        duration: 4000
    });
  };
  
  return (
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight text-center">
            {role === 'cliente' ? 'Bem-vindo, Apostador!' : 'Painel do Vendedor'}
          </h1>
          <p className="text-lg text-muted-foreground mt-2 text-center">
             {role === 'cliente' ? 'Sua sorte começa aqui. Escolha seus números e boa sorte!' : 'Gerencie suas vendas e acompanhe seus resultados.'}
          </p>
      </header>
      
      {role === 'cliente' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    currentUser={currentUser}
                    updateCurrentUserCredits={updateCurrentUserCredits}
                    lotteryConfig={lotteryConfig}
                    initialCart={ticketToRebet ? [ticketToRebet] : []}
                    onPurchaseComplete={() => setTicketToRebet(null)}
                />
            </TabsContent>
            <TabsContent value="bilhetes">
                 <section>
                    <h2 className="text-2xl font-bold text-center text-primary mb-6">
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
  );
}
