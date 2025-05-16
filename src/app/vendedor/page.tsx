
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import type { Draw, Ticket, LotteryConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, ClipboardList, Ticket as TicketIconLucide, BarChart3, PlusCircle, ListChecks, History, PieChart, DollarSign, Percent, TrendingUp, Menu, X, LogOut, LogIn } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets';
const LOTTERY_CONFIG_STORAGE_KEY = 'bolaoPotiguarLotteryConfig';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
};

export default function VendedorPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [clienteTicketsForSummary, setClienteTicketsForSummary] = useState<Ticket[]>([]);
  const [vendedorManagedTickets, setVendedorManagedTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initial load of client status, draws, and lottery config
  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
    const storedConfig = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    if (storedConfig) {
      setLotteryConfig(JSON.parse(storedConfig));
    } else {
      // If no config, set default and save it
      localStorage.setItem(LOTTERY_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_LOTTERY_CONFIG));
    }
  }, []);

  // Load and process tickets once client-side and when draws or vendedorManagedTickets change
  useEffect(() => {
    if (isClient) {
      // Load cliente tickets for summary
      const storedClienteTickets = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
      let initialClienteTickets: Ticket[] = [];
      if (storedClienteTickets) {
        initialClienteTickets = JSON.parse(storedClienteTickets);
      }
      const processedClienteTickets = updateTicketStatusesBasedOnDraws(initialClienteTickets, draws);
      if(JSON.stringify(processedClienteTickets) !== JSON.stringify(clienteTicketsForSummary)){
        setClienteTicketsForSummary(processedClienteTickets);
      }
      
      // Load vendedor tickets
      const storedVendedorTickets = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
      let initialVendedorTickets: Ticket[] = [];
      if (storedVendedorTickets) {
        initialVendedorTickets = JSON.parse(storedVendedorTickets);
      }
      const processedVendedorTickets = updateTicketStatusesBasedOnDraws(initialVendedorTickets, draws);
       if (JSON.stringify(processedVendedorTickets) !== JSON.stringify(vendedorManagedTickets) || initialVendedorTickets.length !== vendedorManagedTickets.length) {
         setVendedorManagedTickets(processedVendedorTickets);
       }
    }
  }, [isClient, draws, clienteTicketsForSummary]);

  // Save vendedorManagedTickets to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(VENDEDOR_TICKETS_STORAGE_KEY, JSON.stringify(vendedorManagedTickets));
      const processedVendedorTickets = updateTicketStatusesBasedOnDraws(vendedorManagedTickets, draws);
      if(JSON.stringify(processedVendedorTickets) !== JSON.stringify(vendedorManagedTickets)){
        setVendedorManagedTickets(processedVendedorTickets);
      }
    }
  }, [vendedorManagedTickets, draws, isClient]); 


  const handleAddSellerTicket = (numbers: number[], buyerName: string, buyerPhone: string) => {
    const newTicket: Ticket = {
      id: uuidv4(),
      numbers: numbers.sort((a, b) => a - b),
      status: 'active', 
      createdAt: new Date().toISOString(),
      buyerName,
      buyerPhone,
    };
    setVendedorManagedTickets(prevTickets => [newTicket, ...prevTickets]);
    toast({ title: "Venda Registrada!", description: "Bilhete adicionado à sua lista de vendas.", className: "bg-primary text-primary-foreground" });
  };
  
  const { activeSellerTicketsCount, totalRevenueFromActiveTickets, commissionEarned } = useMemo(() => {
    const activeTickets = vendedorManagedTickets.filter(ticket => ticket.status === 'active');
    const count = activeTickets.length;
    const revenue = count * lotteryConfig.ticketPrice;
    const commission = revenue * (lotteryConfig.sellerCommissionPercentage / 100);
    return {
      activeSellerTicketsCount: count,
      totalRevenueFromActiveTickets: revenue,
      commissionEarned: commission,
    };
  }, [vendedorManagedTickets, lotteryConfig]);


  const isLotteryActive = draws.length > 0;

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Área do Vendedor...</p>
      </div>
    );
  }

  const menuNavItems = [
    { href: "#seller-ticket-creation-heading", label: "Registrar Venda", Icon: PlusCircle },
    { href: "#seller-ticket-list-heading", label: "Meus Bilhetes Vendidos", Icon: ListChecks },
    { href: "#seller-draw-history-heading", label: "Histórico de Sorteios", Icon: History },
    { href: "#reports-heading", label: "Relatórios e Análises", Icon: PieChart },
  ];

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:justify-start">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline-block sm:ml-2">Voltar para Home</span>
            </Button>
          </Link>
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
            <p className="text-lg text-muted-foreground mt-1">Painel de Controle e Vendas</p>
          </div>
          <div className="w-10 md:hidden"> {/* Hamburger button container */}
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
          <div className="hidden md:block w-[150px] sm:w-[180px] md:w-[200px]"></div> 
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <aside 
          className={cn(
            "fixed inset-0 z-40 w-full h-full flex flex-col bg-card/95 backdrop-blur-sm p-4",
            "md:hidden"
          )}
        >
          <div className="flex justify-end p-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="space-y-2 flex-grow mt-4">
            {menuNavItems.map(item => (
              <Link key={item.label} href={item.href} passHref>
                <Button variant="ghost" className="w-full justify-start text-lg py-3" onClick={() => setIsMobileMenuOpen(false)}>
                  <item.Icon className="mr-3 h-6 w-6" /> {item.label}
                </Button>
              </Link>
            ))}
            {currentUser && (
                <Button variant="outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-lg py-3 mt-6 border-primary text-primary hover:bg-primary/10">
                    <LogOut className="mr-3 h-6 w-6" /> Sair
                </Button>
            )}
            {!currentUser && (
              <Link href="/login" passHref>
                  <Button variant="outline" className="w-full justify-start text-lg py-3 mt-6 border-primary text-primary hover:bg-primary/10" onClick={() => setIsMobileMenuOpen(false)}>
                      <LogIn className="mr-3 h-6 w-6" /> Login / Cadastro
                  </Button>
              </Link>
            )}
          </nav>
        </aside>
      )}

      {/* Desktop Horizontal Navigation */}
      <nav className="mb-10 py-3 bg-card/70 backdrop-blur-sm rounded-lg shadow-md sticky top-4 z-10 hidden md:flex">
        <ul className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mx-auto">
          {menuNavItems.map(item => (
            <li key={item.label}>
              <Link href={item.href} passHref>
                <Button variant="ghost" className="text-primary hover:bg-primary/10">
                  <item.Icon className="mr-2 h-5 w-5" /> {item.label}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="space-y-12 flex-grow">
        <section id="seller-ticket-creation-heading" aria-labelledby="seller-ticket-creation-heading-title" className="scroll-mt-24">
          <h2 id="seller-ticket-creation-heading-title" className="text-3xl font-bold text-primary mb-6 text-center flex items-center justify-center">
            <PlusCircle className="mr-3 h-7 w-7" /> Registrar Nova Venda de Bilhete
          </h2>
          <SellerTicketCreationForm onAddTicket={handleAddSellerTicket} isLotteryActive={isLotteryActive} />
        </section>

        <section id="dashboard-summary-heading" aria-labelledby="dashboard-summary-heading-title" className="mt-16 scroll-mt-24">
          <h2 id="dashboard-summary-heading-title" className="text-3xl font-bold text-primary mb-6 text-center">
            Resumo Geral
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sorteios Cadastrados
                </CardTitle>
                <ClipboardList className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{draws.length}</div>
                 <p className="text-xs text-muted-foreground">Total de sorteios na loteria atual.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bilhetes Vendidos (Total)
                </CardTitle>
                <TicketIconLucide className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{vendedorManagedTickets.length}</div>
                <p className="text-xs text-muted-foreground">Todos os bilhetes que você já vendeu.</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bilhetes (App Clientes) 
                </CardTitle>
                <TicketIconLucide className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{clienteTicketsForSummary.length}</div> 
                 <p className="text-xs text-muted-foreground">Total de bilhetes de clientes.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="reports-heading" aria-labelledby="reports-heading-title" className="mt-16 scroll-mt-24">
          <h2 id="reports-heading-title" className="text-3xl font-bold text-primary mb-8 text-center flex items-center justify-center">
            <BarChart3 className="mr-3 h-8 w-8" /> Relatórios e Análises (Ciclo Atual)
          </h2>
          <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-center font-semibold text-primary">Desempenho de Vendas</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Seu resumo de vendas para o ciclo atual da loteria. A comissão é zerada ao iniciar uma nova loteria.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-lg bg-background/70 shadow">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Bilhetes Ativos Vendidos</p>
                <p className="text-2xl font-bold text-primary">{activeSellerTicketsCount}</p>
              </div>
              <div className="p-4 rounded-lg bg-background/70 shadow">
                <DollarSign className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Valor Arrecadado (Ativos)</p>
                <p className="text-2xl font-bold text-green-500">
                  R$ {totalRevenueFromActiveTickets.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/70 shadow">
                <Percent className="h-10 w-10 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Comissão ({lotteryConfig.sellerCommissionPercentage}%)</p>
                <p className="text-2xl font-bold text-accent">
                  R$ {commissionEarned.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </CardContent>
             <CardFooter className="pt-6">
                <p className="text-xs text-muted-foreground text-center w-full">
                    Preço atual do bilhete: R$ {lotteryConfig.ticketPrice.toFixed(2).replace('.', ',')}.
                    A comissão é calculada sobre os bilhetes com status 'ativo' vendidos por você neste ciclo da loteria.
                </p>
            </CardFooter>
          </Card>
        </section>

        <section id="seller-ticket-list-heading" aria-labelledby="seller-ticket-list-heading-title" className="mt-16 scroll-mt-24">
          <h2 id="seller-ticket-list-heading-title" className="text-3xl font-bold text-primary mb-8 text-center">
            Meus Bilhetes Vendidos
          </h2>
           {vendedorManagedTickets.length > 0 ? (
            <TicketList tickets={vendedorManagedTickets} draws={draws} /> 
          ) : (
             <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                <TicketIconLucide size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Nenhum bilhete de vendedor registrado ainda.</p>
                <p className="text-sm text-muted-foreground/80">Use o formulário acima para registrar uma venda.</p>
             </div>
          )}
        </section>

        <section id="seller-draw-history-heading" aria-labelledby="seller-draw-history-heading-title" className="mt-16 scroll-mt-24">
          <h2 id="seller-draw-history-heading-title" className="text-3xl font-bold text-primary mb-8 text-center">
            Histórico de Sorteios
          </h2>
          {draws.length > 0 ? (
            <AdminDrawList draws={draws} />
          ) : (
             <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                <ClipboardList size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Nenhum sorteio cadastrado ainda.</p>
             </div>
          )}
        </section>
      </main>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Área do Vendedor.
        </p>
      </footer>
    </div>
  );
}
