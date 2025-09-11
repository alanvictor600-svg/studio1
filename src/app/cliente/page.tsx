
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import type { Ticket, Draw, LotteryConfig } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, X, Ticket as TicketIconLucide, ListChecks, LogOut, LogIn, Palette, History, Coins } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { AdminDrawList } from '@/components/admin-draw-list';

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets';
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const LOTTERY_CONFIG_STORAGE_KEY = 'bolaoPotiguarLotteryConfig';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

type ClienteSection = 'selecionar-bilhete' | 'meus-bilhetes' | 'resultados';

const menuItems: { id: ClienteSection; label: string; Icon: React.ElementType }[] = [
  { id: 'selecionar-bilhete', label: 'Nova Aposta', Icon: TicketIconLucide },
  { id: 'meus-bilhetes', label: 'Meus Bilhetes', Icon: ListChecks },
  { id: 'resultados', label: 'Resultados', Icon: History },
];

export default function ClientePage() {
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout, isAuthenticated, updateCurrentUserCredits } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ClienteSection>('selecionar-bilhete');

  // Load data and update statuses
  useEffect(() => {
    if (!isAuthenticated) return;

    setIsClient(true);
    
    const storedDrawsRaw = localStorage.getItem(DRAWS_STORAGE_KEY);
    const localDraws = storedDrawsRaw ? JSON.parse(storedDrawsRaw) : [];
    setDraws(localDraws);

    const clientTicketsRaw = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
    const allClientTickets: Ticket[] = clientTicketsRaw ? JSON.parse(clientTicketsRaw) : [];
    
    const vendedorTicketsRaw = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    const allVendedorTickets: Ticket[] = vendedorTicketsRaw ? JSON.parse(vendedorTicketsRaw) : [];

    const combinedTickets = [...allClientTickets, ...allVendedorTickets];
    setAllTickets(combinedTickets);
    
    // Process all tickets first to determine their status
    const processedTickets = updateTicketStatusesBasedOnDraws(allClientTickets, localDraws);
    
    // Then, filter to show only the current user's tickets
    const userTickets = processedTickets.filter(
      (ticket: Ticket) => ticket.buyerName === currentUser?.username
    );
    setMyTickets(userTickets);

    const storedConfig = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    setLotteryConfig(storedConfig ? JSON.parse(storedConfig) : DEFAULT_LOTTERY_CONFIG);

    // Also, re-save all tickets to ensure statuses are up-to-date in storage
    localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(processedTickets));

  }, [isAuthenticated, currentUser?.username]);

  const handleAddTicket = useCallback((newTicket: Ticket) => {
    // This function will now simply add the pre-validated ticket to the state
    // and update localStorage.
    const storedTicketsRaw = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
    const allClientTickets = storedTicketsRaw ? JSON.parse(storedTicketsRaw) : [];
    const updatedAllTickets = [newTicket, ...allClientTickets];
    localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(updatedAllTickets));
    
    setMyTickets(prevTickets => [newTicket, ...prevTickets]);
  }, []);

  const handleSectionChange = (sectionId: ClienteSection) => {
    setActiveSection(sectionId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const isLotteryPaused = useMemo(() => {
    // Sales are paused if there are winning tickets
    return draws.length > 0;
  }, [draws]);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando área do cliente...</p>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'selecionar-bilhete':
        return (
          <section aria-labelledby="ticket-selection-heading" id="selecionar-bilhete" className="scroll-mt-20">
            <h2 id="ticket-selection-heading" className="sr-only">Seleção de Bilhetes</h2>
            <TicketSelectionForm 
              onAddTicket={handleAddTicket} 
              isLotteryPaused={isLotteryPaused}
              currentUser={currentUser}
              updateCurrentUserCredits={updateCurrentUserCredits}
              lotteryConfig={lotteryConfig}
            />
          </section>
        );
      case 'meus-bilhetes':
        return (
          <section aria-labelledby="ticket-management-heading" id="meus-bilhetes" className="scroll-mt-20">
            <h2 id="ticket-management-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
              Meus Bilhetes
            </h2>
            <TicketList
              tickets={myTickets}
              draws={draws}
            />
          </section>
        );
      case 'resultados':
        return (
          <section aria-labelledby="draw-history-heading" id="resultados" className="scroll-mt-20">
            <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
              Resultados dos Sorteios
            </h2>
            <AdminDrawList draws={draws} />
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div className="w-10 h-10" />
          
          <div className="text-center flex-grow">
            <div className="mb-2 flex justify-center">
              <Image
                src="/logo.png"
                alt="Logo Bolão Potiguar"
                width={100}
                height={100}
                priority
                className="mx-auto"
              />
            </div>
             <p className="text-lg text-muted-foreground mt-1">Sua sorte começa aqui!</p>
          </div>

          <div className="w-10 h-10 flex items-center justify-center">
             <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-x-8 gap-y-6 flex-grow mt-8">
        <aside 
          className={cn(
            "bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-md md:sticky md:top-20 md:self-start max-h-[calc(100vh-10rem)] overflow-y-auto transition-transform duration-300 ease-in-out md:translate-x-0",
            "md:w-64 lg:w-72 flex-shrink-0",
            isMobileMenuOpen 
              ? "fixed inset-0 z-40 w-full h-full flex flex-col md:relative md:inset-auto md:h-auto md:w-64 lg:w-72" 
              : "hidden md:flex" 
          )}
        >
          {isMobileMenuOpen && (
            <div className="flex justify-end p-2 md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
          <nav className="space-y-2 flex-grow md:flex-grow-0">
             {currentUser && (
                <div className="p-3 mb-2 rounded-lg bg-primary/10 text-center">
                    <p className="text-sm font-semibold text-primary">Seu Saldo</p>
                    <p className="text-2xl font-bold text-primary">
                        R$ {(currentUser.credits || 0).toFixed(2).replace('.', ',')}
                    </p>
                </div>
            )}
             <Link href="/solicitar-saldo" passHref>
                <Button variant="outline" className="w-full justify-center text-sm py-3 px-4 h-auto mb-2 border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400">
                    <Coins className="mr-2 h-5 w-5" /> Solicitar Saldo
                </Button>
            </Link>
            {menuItems.map(item => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start text-sm py-3 px-4 h-auto",
                  activeSection === item.id 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "hover:bg-muted/50 hover:text-primary"
                )}
                onClick={() => handleSectionChange(item.id)}
              >
                <item.Icon className={cn("mr-3 h-5 w-5", activeSection === item.id ? "text-primary-foreground" : "text-primary")} />
                {item.label}
              </Button>
            ))}

            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-sm py-3 px-4 h-auto rounded-md hover:bg-muted/50">
                <span className="flex items-center text-primary">
                  <Palette className="mr-3 h-5 w-5" />
                  Mudar Tema
                </span>
                <ThemeToggleButton />
              </div>
            </div>

            {currentUser ? (
                <Button variant="outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-sm py-3 px-4 h-auto mt-6 border-primary text-primary hover:bg-primary/10">
                    <LogOut className="mr-3 h-5 w-5" /> Sair
                </Button>
            ) : (
              <Link href="/login" passHref>
                  <Button variant="outline" className="w-full justify-start text-sm py-3 px-4 h-auto mt-6 border-primary text-primary hover:bg-primary/10" onClick={() => setIsMobileMenuOpen(false)}>
                      <LogIn className="mr-3 h-5 w-5" /> Login / Cadastro
                  </Button>
              </Link>
            )}
          </nav>
        </aside>

        <main className={cn("flex-grow space-y-12", isMobileMenuOpen && "md:ml-0")}>
          {renderSectionContent()}
        </main>
      </div>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Jogue com responsabilidade. Para maiores de 18 anos.
        </p>
      </footer>
    </div>
  );
}

    
    