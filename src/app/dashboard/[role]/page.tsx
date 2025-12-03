
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
import DashboardLoading from '../loading';

export default function DashboardPage() {
    const params = useParams();
    const { role } = params as { role: 'cliente' | 'vendedor' };
    const { isDataLoading } = useDashboard();

    // Show a loading state from the context before rendering the specific role's page.
    // This ensures all data (tickets, draws, config) is ready.
    if (isDataLoading) {
        return <DashboardLoading />;
    }
    
    if (role === 'cliente') {
        return <ClientePageContent />;
    }
    
    if (role === 'vendedor') {
        return <VendedorPageContent />;
    }

    // Fallback in case the role is not recognized, though routing should prevent this.
    return <p>Painel desconhecido. Verifique o URL.</p>;
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
      // Add the numbers from the old ticket to the cart for a new purchase.
      setCart(prevCart => [...prevCart, ticketToRebet]);
      setTicketToRebet(null); // Reset the state after adding.
      setActiveTab('aposta'); // Switch to the betting tab so the user can see the new ticket in the form.
       toast({
        title: "Bilhete adicionado ao carrinho!",
        description: "A aposta selecionada está pronta para ser comprada novamente no carrinho.",
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
    <div className="flex flex-col h-full space-y-8">
      <header className="flex-shrink-0">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-500 text-transparent bg-clip-text">
            Bem-vindo, Apostador!
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             Sua sorte começa aqui. Escolha seus números e boa sorte!
          </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col">
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
          
          <TabsContent value="aposta" className="flex-grow flex flex-col">
              {isLotteryPaused ? (
                  <div className="flex items-center justify-center flex-1">
                    <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground max-w-lg">
                        <PauseCircle className="h-5 w-5 text-primary" />
                        <AlertTitle className="text-primary font-bold">Apostas Pausadas</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                        O registro de novas apostas está suspenso.
                        Aguarde o administrador iniciar um novo ciclo para continuar apostando.
                        </AlertDescription>
                    </Alert>
                  </div>
              ) : (
                <TicketSelectionForm 
                    cart={cart}
                    onCartChange={setCart}
                    isSubmitting={isSubmitting}
                />
              )}
          </TabsContent>
          
          <TabsContent value="bilhetes" className="flex-grow">
               <TicketList
                    tickets={userTickets}
                    draws={allDraws}
                    onRebet={handleRebet}
                    onGenerateReceipt={handleGenerateReceipt}
                />
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
        handleGenerateReceipt,
    } = useDashboard();
    
    // This state is local because it only affects the seller's view of their own tickets.
    const [localTickets, setLocalTickets] = useState<Ticket[]>(userTickets);

    // Keep local state in sync with context to reflect real-time updates.
    useEffect(() => {
        setLocalTickets(userTickets);
    }, [userTickets]);

    // When a ticket is created via the form, add it to the top of the local list for immediate feedback.
    // The onSnapshot listener will eventually update this, but this provides a better UX.
    const handleTicketCreated = (newTicket: Ticket) => {
        setLocalTickets(prevTickets => [newTicket, ...prevTickets]);
    };
    
    return (
        <div className="flex flex-col h-full space-y-8">
            <header>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-600 text-transparent bg-clip-text">
                    Painel do Vendedor
                </h1>
                <p className="text-lg text-white/80 mt-2 text-center">
                    Gerencie suas vendas, acompanhe seus resultados e ganhe comissões.
                </p>
            </header>
            
            <SellerDashboard
                isLotteryPaused={isLotteryPaused}
                onTicketCreated={handleTicketCreated}
                userTickets={localTickets}
                currentUser={currentUser}
                allDraws={allDraws}
            />
        </div>
    );
}
