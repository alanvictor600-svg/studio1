
"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { User, LotteryConfig, Ticket, Draw } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { SellerDashboard } from '@/components/seller-dashboard';
import { TicketList } from '@/components/ticket-list';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';

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
  
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isLotteryPaused, setIsLotteryPaused] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [allDraws, setAllDraws] = useState<Draw[]>([]);

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
      
      const allTicketsQuery = query(collection(db, 'tickets'));
      const unsubscribePauseCheck = onSnapshot(allTicketsQuery, (allTicketsSnapshot) => {
        const allTicketsData = allTicketsSnapshot.docs.map(t => ({ id: t.id, ...t.data() } as Ticket));
        const processedTickets = updateTicketStatusesBasedOnDraws(allTicketsData, drawsData);
        const hasWinningTickets = processedTickets.some(t => t.status === 'winning');
        setIsLotteryPaused(hasWinningTickets);
      });
      
      return () => unsubscribePauseCheck();

    }, (error) => {
      console.error("Error fetching draws for pause check: ", error);
    });

    // OPTIMIZED QUERY: Fetch only tickets relevant to the user.
    const idField = role === 'cliente' ? 'buyerId' : 'sellerId';
    const ticketsQuery = query(
        collection(db, 'tickets'), 
        where(idField, '==', currentUser.id),
        orderBy('createdAt', 'desc')
    );
      
    const unsubscribeTickets = onSnapshot(ticketsQuery, (ticketSnapshot) => {
        const userTicketsData = ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
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
    return <div className="text-center p-10">Você precisa estar logado para ver esta página.</div>;
  }
  
  if (currentUser.role !== role) {
    return <div className="text-center p-10">Acesso negado. Você não tem permissão para ver este painel.</div>
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    // The onSnapshot listener will handle the update automatically.
    // This function can be kept for optimistic updates in the future if needed.
  };
  
  return (
    <div className="space-y-12">
      {role === 'cliente' && (
        <>
          <TicketSelectionForm
            isLotteryPaused={isLotteryPaused}
            currentUser={currentUser}
            updateCurrentUserCredits={updateCurrentUserCredits}
            lotteryConfig={lotteryConfig}
          />
          <section>
            <h2 className="text-2xl font-bold text-center text-primary mb-6">
              Meus Bilhetes
            </h2>
            <TicketList tickets={processedUserTickets} draws={allDraws} />
          </section>
        </>
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
