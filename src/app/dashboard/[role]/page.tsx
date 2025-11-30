
"use client";

import { useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import type { Ticket } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingCart, PauseCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { SellerDashboard } from '@/components/seller-dashboard';

export default function DashboardPage() {
    const params = useParams();
    const { role } = params as { role: 'cliente' | 'vendedor' };
    
    if (role === 'cliente') {
        return <ClientePageContent />;
    }
    
    if (role === 'vendedor') {
        return <VendedorPageContent />;
    }

    return <p>Painel desconhecido.</p>;
}

function ClientePageContent() {
  const {
    cart,
    setCart,
    isSubmitting,
    userTickets,
    allDraws,
    isLotteryPaused,
    handleGenerateReceipt,
  } = useDashboard();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('aposta');
  const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);

  useEffect(() => {
    if (ticketToRebet) {
      setCart(prevCart => [...prevCart, ticketToRebet]);
      setTicketToRebet(null); 
      setActiveTab('aposta');
       toast({
        title: "Bilhete adicionado ao carrinho!",
        description: "A aposta selecionada está pronta para ser comprada novamente.",
        duration: 4000
      });
    }
  }, [ticketToRebet, toast, setCart]);
  
  const handleRebet = (numbers: number[]) => {
    setTicketToRebet(numbers);
  };

  const TABS_CONFIG = [
    { value: 'aposta', label: 'Fazer Aposta', Icon: TicketIcon },
    { value: 'bilhetes', label: 'Meus Bilhetes', Icon: ShoppingCart },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-transparent bg-clip-text">
            Bem-vindo, Apostador!
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             Sua sorte começa aqui. Escolha seus números e boa sorte!
          </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col mt-8">
          <TabsList className={`grid w-full grid-cols-2 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md flex-shrink-0`}>
              {TABS_CONFIG.map(tab => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                  >
                      <tab.Icon className="mr-2 h-5 w-5" /> {tab.label}
                  </TabsTrigger>
              ))}
          </TabsList>
          
          <TabsContent value="aposta" className="flex-grow">
              {isLotteryPaused ? (
                  <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground max-w-2xl mx-auto">
                      <PauseCircle className="h-5 w-5 text-primary" />
                      <AlertTitle className="text-primary font-bold">Apostas Pausadas</AlertTitle>
                      <AlertDescription className="text-muted-foreground">
                      O registro de novas apostas está suspenso.
                      Aguarde o administrador iniciar um novo ciclo para continuar apostando.
                      </AlertDescription>
                  </Alert>
              ) : (
                  <TicketSelectionForm
                      cart={cart}
                      onCartChange={setCart}
                      isSubmitting={isSubmitting}
                  />
              )}
          </TabsContent>
          
          <TabsContent value="bilhetes" className="flex-grow">
              <section>
                  <h2 className="text-2xl font-bold text-center text-white mb-6">
                      Meus Bilhetes
                  </h2>
                  <TicketList 
                    tickets={userTickets} 
                    draws={allDraws} 
                    onRebet={handleRebet}
                    onGenerateReceipt={handleGenerateReceipt} 
                  />
              </section>
          </TabsContent>
      </Tabs>
    </div>
  );
}

function VendedorPageContent() {
  const { currentUser } = useAuth();
  const {
      userTickets,
      allDraws,
      isLotteryPaused,
  } = useDashboard();

  if (!currentUser) {
    return null;
  }
  
  const handleTicketCreated = (newTicket: Ticket) => {
    // The onSnapshot in the context will automatically update the list.
  };

  return (
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-transparent bg-clip-text">
            Painel do Vendedor
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             Gerencie suas vendas e acompanhe seus resultados.
          </p>
      </header>

      <SellerDashboard 
            isLotteryPaused={isLotteryPaused}
            onTicketCreated={handleTicketCreated}
            userTickets={userTickets}
            currentUser={currentUser}
            allDraws={allDraws}
        />
    </div>
  );
}
