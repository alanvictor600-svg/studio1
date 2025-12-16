
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PauseCircle } from 'lucide-react';


export default function DashboardRolePageClient() {
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
    // This case is primarily handled by the layout, but as a fallback:
    return <div className="text-center p-10 text-white">Você precisa estar logado para ver esta página.</div>;
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
    <div className="p-4 md:p-8 bg-gradient-to-b from-emerald-700 to-emerald-900">
    {role === 'cliente' && (
      <Tabs value={clientTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md">
              <TabsTrigger value="aposta" className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                  <TicketIcon className="mr-2 h-5 w-5" /> Fazer Aposta
              </TabsTrigger>
              <TabsTrigger value="bilhetes" className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                  <ShoppingBag className="mr-2 h-5 w-5" /> Meus Bilhetes
              </TabsTrigger>
          </TabsList>
          <TabsContent value="aposta">
              {isLotteryPaused ? (
                  <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground max-w-2xl mx-auto">
                      <PauseCircle className="h-5 w-5 text-primary" />
                      <AlertTitle className="text-primary font-bold">Apostas Pausadas</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                      O registro de novas apostas está suspenso.
                      Aguarde o administrador iniciar um novo ciclo para continuar apostando.
                      </Aler