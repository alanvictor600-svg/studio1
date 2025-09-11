
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import type { Draw, Ticket, LotteryConfig, SellerHistoryEntry } from '@/types';
import { ClipboardList, Ticket as TicketIconLucide, PieChart, PlusCircle, ListChecks, History, DollarSign, Percent, TrendingUp, Menu, X, LogOut, LogIn, Palette, Coins } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';


const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

type VendedorSection = 'nova-venda' | 'meus-bilhetes' | 'resultados' | 'relatorios';

const menuItems: { id: VendedorSection; label: string; Icon: React.ElementType }[] = [
  { id: 'nova-venda', label: 'Nova Venda', Icon: PlusCircle },
  { id: 'meus-bilhetes', label: 'Bilhetes Vendidos', Icon: ListChecks },
  { id: 'resultados', label: 'Resultados', Icon: History },
  { id: 'relatorios', label: 'Relatórios', Icon: PieChart },
];


export default function VendedorPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [vendedorManagedTickets, setVendedorManagedTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout, updateCurrentUserCredits, isLoading, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<VendedorSection>('nova-venda');
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (!isLoading && (!isAuthenticated || currentUser?.role !== 'vendedor')) {
      router.push('/login?redirect=/vendedor');
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  // Set up Firestore listeners
  useEffect(() => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'vendedor') return;

    const unsubscribes: (() => void)[] = [];

    // Listener for draws
    const drawsQuery = query(collection(db, 'draws'), orderBy('createdAt', 'desc'));
    unsubscribes.push(onSnapshot(drawsQuery, (snapshot) => {
        setDraws(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw)));
    }));

    // Listener for seller's managed tickets
    const ticketsQuery = query(collection(db, 'tickets'), where('sellerUsername', '==', currentUser.username));
    unsubscribes.push(onSnapshot(ticketsQuery, (snapshot) => {
        setVendedorManagedTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    }));

    // Listener for lottery config
    unsubscribes.push(onSnapshot(doc(db, 'config', 'lottery'), (docSnap) => {
        if (docSnap.exists()) {
            setLotteryConfig(docSnap.data() as LotteryConfig);
        } else {
            setLotteryConfig(DEFAULT_LOTTERY_CONFIG);
        }
    }));
    
    // Listener for seller's history
    const historyQuery = query(collection(db, 'sellerHistory'), where('sellerUsername', '==', currentUser.username), orderBy('endDate', 'desc'));
    unsubscribes.push(onSnapshot(historyQuery, (snapshot) => {
        setSellerHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SellerHistoryEntry)));
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [isAuthenticated, currentUser]);

  const processedVendedorTickets = useMemo(() => updateTicketStatusesBasedOnDraws(vendedorManagedTickets, draws), [vendedorManagedTickets, draws]);

  const { activeSellerTicketsCount, totalRevenueFromActiveTickets, commissionEarned } = useMemo(() => {
    if (!currentUser || currentUser.role !== 'vendedor') return { activeSellerTicketsCount: 0, totalRevenueFromActiveTickets: 0, commissionEarned: 0 };
    const activeTickets = processedVendedorTickets.filter(ticket => ticket.status === 'active');
    const count = activeTickets.length;
    const revenue = count * lotteryConfig.ticketPrice;
    const commission = revenue * (lotteryConfig.sellerCommissionPercentage / 100);
    return {
      activeSellerTicketsCount: count,
      totalRevenueFromActiveTickets: revenue,
      commissionEarned: commission,
    };
  }, [processedVendedorTickets, lotteryConfig, currentUser]);


  const isLotteryPaused = useMemo(() => {
    return draws.length > 0;
  }, [draws]);

  const handleSectionChange = (sectionId: VendedorSection) => {
    setActiveSection(sectionId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  if (!isClient || isLoading || !currentUser || currentUser.role !== 'vendedor') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Área do Vendedor...</p>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'nova-venda':
        return (
          <section id="seller-ticket-creation-heading" aria-labelledby="seller-ticket-creation-heading-title" className="scroll-mt-24">
            <h2 id="seller-ticket-creation-heading-title" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <PlusCircle className="mr-3 h-8 w-8 text-primary" /> Nova Venda
            </h2>
            <SellerTicketCreationForm 
              isLotteryPaused={isLotteryPaused}
              lotteryConfig={lotteryConfig} 
            />
          </section>
        );
      case 'meus-bilhetes':
        return (
          <section id="seller-ticket-list-heading" aria-labelledby="seller-ticket-list-heading-title" className="scroll-mt-24">
            <h2 id="seller-ticket-list-heading-title" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <ListChecks className="mr-3 h-8 w-8 text-primary" /> Bilhetes Vendidos Por Mim
            </h2>
            {processedVendedorTickets.length > 0 ? (
              <TicketList tickets={processedVendedorTickets} draws={draws} /> 
            ) : (
               <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                  <TicketIconLucide size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg">Nenhum bilhete vendido por você ainda.</p>
                  <p className="text-sm text-muted-foreground/80">Use o formulário de "Nova Venda" para registrar.</p>
               </div>
            )}
          </section>
        );
      case 'resultados':
        return (
          <section id="seller-draw-history-heading" aria-labelledby="seller-draw-history-heading-title" className="scroll-mt-24">
            <h2 id="seller-draw-history-heading-title" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <History className="mr-3 h-8 w-8 text-primary" /> Resultados dos Sorteios
            </h2>
            <AdminDrawList draws={draws} />
          </section>
        );
      case 'relatorios':
        return (
          <>
            <section id="dashboard-summary-heading" aria-labelledby="dashboard-summary-heading-title" className="scroll-mt-24 space-y-12">
              <h2 id="dashboard-summary-heading-title" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
                 <PieChart className="mr-3 h-8 w-8 text-primary" /> Resumo Geral e Relatórios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
         
              <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-semibold text-primary">Desempenho de Vendas (Ciclo Atual)</CardTitle>
                  <CardDescription className="text-center text-muted-foreground">
                    Seu resumo de vendas para o ciclo atual da loteria (bilhetes com status 'ativo').
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
                    <Percent className="h-10 w-10 text-secondary mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Comissão do Vendedor</p>
                    <p className="text-2xl font-bold text-secondary">
                      R$ {commissionEarned.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-2">
                    <p className="text-xs text-muted-foreground">
                        Preço do bilhete: R$ {lotteryConfig.ticketPrice.toFixed(2).replace('.', ',')}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Comissão: {lotteryConfig.sellerCommissionPercentage}%.
                    </p>
                </CardFooter>
              </Card>

              <Card className="shadow-xl bg-card/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-center font-semibold text-primary">Histórico de Ciclos Anteriores</CardTitle>
                  <CardDescription className="text-center text-muted-foreground">
                    Resumo do seu desempenho em cada ciclo de loteria encerrado pelo administrador.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sellerHistory.length > 0 ? (
                    <ScrollArea className="h-72 w-full rounded-md border">
                        <Table>
                          <TableCaption>Um registro do seu desempenho de vendas por ciclo.</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-center">Data Encerramento</TableHead>
                              <TableHead className="text-center">Bilhetes Ativos</TableHead>
                              <TableHead className="text-center">Receita (R$)</TableHead>
                              <TableHead className="text-right">Comissão (R$)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sellerHistory.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-center font-medium">
                                  {format(parseISO(entry.endDate), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-center">{entry.activeTicketsCount}</TableCell>
                                <TableCell className="text-center">{entry.totalRevenue.toFixed(2).replace('.', ',')}</TableCell>
                                <TableCell className="text-right font-semibold text-secondary">{entry.totalCommission.toFixed(2).replace('.', ',')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Nenhum histórico de ciclo anterior encontrado.</p>
                  )}
                </CardContent>
              </Card>

            </section>
          </>
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
            <p className="text-lg text-muted-foreground mt-1">Painel de Controle e Vendas</p>
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
                        R$ {(currentUser.saldo || 0).toFixed(2).replace('.', ',')}
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

             {currentUser && (
                <Button variant="outline" onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full justify-start text-sm py-3 px-4 h-auto mt-6 border-primary text-primary hover:bg-primary/10">
                    <LogOut className="mr-3 h-5 w-5" /> Sair
                </Button>
            )}
            {!currentUser && (
              <Link href="/login" passHref>
                  <Button variant="outline" className="w-full justify-start text-sm py-3 px-4 h-auto mt-6 border-primary text-primary hover:bg-primary/10" onClick={() => setIsMobileMenuOpen(false)}>
                      <LogIn className="mr-3 h-5 w-5" /> Login / Cadastro
                  </Button>
              </Link>
            )}
          </nav>
        </aside>

        <main className={cn("flex-grow", isMobileMenuOpen && "md:ml-0")}>
          {renderSectionContent()}
        </main>
      </div>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Área do Vendedor.
        </p>
      </footer>
    </div>
  );
