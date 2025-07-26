
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Draw, Ticket, LotteryConfig, SellerHistoryEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, Rocket, AlertTriangle, Settings, DollarSign, Percent, PlusCircle, ShieldCheck, History, Menu, X, Palette as PaletteIcon } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets'; // Added for history capture
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const LOTTERY_CONFIG_STORAGE_KEY = 'bolaoPotiguarLotteryConfig';
const SELLER_HISTORY_STORAGE_KEY = 'bolaoPotiguarSellerHistory'; // Added for history capture


const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2, // Default price R$2.00
  sellerCommissionPercentage: 10, // Default 10%
};

type AdminSection = 'configuracoes' | 'cadastrar-sorteio' | 'controles-loteria' | 'historico-sorteios' | 'bilhetes-premiados';

const menuItems: { id: AdminSection; label: string; Icon: React.ElementType }[] = [
  { id: 'configuracoes', label: 'Configurações', Icon: Settings },
  { id: 'cadastrar-sorteio', label: 'Cadastrar Sorteio', Icon: PlusCircle },
  { id: 'controles-loteria', label: 'Controles', Icon: ShieldCheck },
  { id: 'historico-sorteios', label: 'Histórico Sorteios', Icon: History },
  { id: 'bilhetes-premiados', label: 'Bilhetes Premiados', Icon: Trophy },
];

export default function AdminPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const [ticketPriceInput, setTicketPriceInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.ticketPrice.toString());
  const [commissionInput, setCommissionInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage.toString());

  const [activeSection, setActiveSection] = useState<AdminSection>('cadastrar-sorteio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
    const storedTickets = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
    if (storedTickets) {
      setAllTickets(JSON.parse(storedTickets));
    }
    const storedConfig = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      setLotteryConfig(parsedConfig);
      setTicketPriceInput(parsedConfig.ticketPrice.toString());
      setCommissionInput(parsedConfig.sellerCommissionPercentage.toString());
    } else {
      setTicketPriceInput(DEFAULT_LOTTERY_CONFIG.ticketPrice.toString());
      setCommissionInput(DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage.toString());
      localStorage.setItem(LOTTERY_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_LOTTERY_CONFIG));
    }
  }, []); 

  useEffect(() => {
    if (isClient) {
      const processedTickets = updateTicketStatusesBasedOnDraws(allTickets, draws);
      if (JSON.stringify(processedTickets) !== JSON.stringify(allTickets)) {
         setAllTickets(processedTickets);
      }
      localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(processedTickets));
    }
  }, [allTickets, draws, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(DRAWS_STORAGE_KEY, JSON.stringify(draws));
    }
  }, [draws, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOTTERY_CONFIG_STORAGE_KEY, JSON.stringify(lotteryConfig));
    }
  }, [lotteryConfig, isClient]);

  const winningTickets = useMemo(() => {
    return allTickets.filter(ticket => ticket.status === 'winning');
  }, [allTickets]);

  const handleAddDraw = (newNumbers: number[], name?: string) => {
    if (winningTickets.length > 0) {
      toast({ title: "Ação Bloqueada", description: "Não é possível cadastrar sorteios enquanto houver bilhetes premiados. Inicie uma nova loteria.", variant: "destructive" });
      return;
    }
    if (newNumbers.length !== 5) {
      toast({ title: "Erro de Validação", description: "O sorteio deve conter exatamente 5 números.", variant: "destructive" });
      return;
    }
    const newDraw: Draw = {
      id: uuidv4(),
      numbers: newNumbers.sort((a, b) => a - b),
      createdAt: new Date().toISOString(),
      name: name || undefined,
    };
    setDraws(prevDraws => [newDraw, ...prevDraws]);
    toast({ title: "Sorteio Cadastrado!", description: "O novo sorteio foi registrado com sucesso.", className: "bg-primary text-primary-foreground" });
  };
  
  const captureAndSaveSellerHistory = () => {
    const sellerTicketsRaw = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    const sellerTickets: Ticket[] = sellerTicketsRaw ? JSON.parse(sellerTicketsRaw) : [];
    
    const configRaw = localStorage.getItem(LOTTERY_CONFIG_STORAGE_KEY);
    const currentConfig: LotteryConfig = configRaw ? JSON.parse(configRaw) : DEFAULT_LOTTERY_CONFIG;
    
    const activeTickets = sellerTickets.filter(ticket => ticket.status === 'active');
    const activeSellerTicketsCount = activeTickets.length;
    const totalRevenueFromActiveTickets = activeSellerTicketsCount * currentConfig.ticketPrice;
    const commissionEarned = totalRevenueFromActiveTickets * (currentConfig.sellerCommissionPercentage / 100);

    const newHistoryEntry: SellerHistoryEntry = {
      id: uuidv4(),
      endDate: new Date().toISOString(),
      activeTicketsCount: activeSellerTicketsCount,
      totalRevenue: totalRevenueFromActiveTickets,
      totalCommission: commissionEarned,
    };

    const historyRaw = localStorage.getItem(SELLER_HISTORY_STORAGE_KEY);
    const history: SellerHistoryEntry[] = historyRaw ? JSON.parse(historyRaw) : [];
    history.push(newHistoryEntry);
    localStorage.setItem(SELLER_HISTORY_STORAGE_KEY, JSON.stringify(history));

    toast({ title: "Histórico do Vendedor Salvo!", description: "Um resumo do ciclo de vendas atual foi salvo.", className: "bg-secondary text-secondary-foreground" });
  };


  const handleStartNewLottery = () => {
    // Capture seller history before resetting everything
    captureAndSaveSellerHistory();
  
    setDraws([]);
    setAllTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticket.status === 'active' || ticket.status === 'winning') {
          return { ...ticket, status: 'expired' as Ticket['status'] };
        }
        return ticket;
      })
    );
    // Also reset seller tickets status
    const sellerTicketsRaw = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    if (sellerTicketsRaw) {
        let sellerTickets: Ticket[] = JSON.parse(sellerTicketsRaw);
        sellerTickets = sellerTickets.map(ticket => ({ ...ticket, status: 'expired' }));
        localStorage.setItem(VENDEDOR_TICKETS_STORAGE_KEY, JSON.stringify(sellerTickets));
    }


    toast({
      title: "Nova Loteria Iniciada!",
      description: "Sorteios anteriores e bilhetes ativos/premiados foram resetados/expirados.",
      className: "bg-primary text-primary-foreground",
    });
    setIsConfirmDialogOpen(false); 
  };

  const handleSaveLotteryConfig = () => {
    const price = parseFloat(ticketPriceInput);
    const commission = parseInt(commissionInput, 10);

    if (isNaN(price) || price <= 0) {
      toast({ title: "Erro de Configuração", description: "Preço do bilhete inválido.", variant: "destructive" });
      return;
    }
    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast({ title: "Erro de Configuração", description: "Porcentagem de comissão inválida (deve ser entre 0 e 100).", variant: "destructive" });
      return;
    }
    setLotteryConfig({ ticketPrice: price, sellerCommissionPercentage: commission });
    toast({ title: "Configurações Salvas!", description: "Preço do bilhete e comissão atualizados.", className: "bg-primary text-primary-foreground" });
  };

  const handleSectionChange = (sectionId: AdminSection) => {
    setActiveSection(sectionId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Admin...</p>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'configuracoes':
        return (
          <section aria-labelledby="lottery-settings-heading">
            <h2 id="lottery-settings-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
                <Settings className="mr-3 h-8 w-8 text-primary" />
                Configurações da Loteria
            </h2>
            <div className="space-y-8">
              <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                      <CardTitle className="text-xl text-center font-semibold">Definir Preços e Comissões</CardTitle>
                      <CardDescription className="text-center text-muted-foreground">
                          Ajuste o valor dos bilhetes e a comissão dos vendedores.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="space-y-2">
                          <Label htmlFor="ticketPrice" className="flex items-center">
                              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                              Preço do Bilhete (R$)
                          </Label>
                          <Input 
                              id="ticketPrice" 
                              type="number" 
                              value={ticketPriceInput}
                              onChange={(e) => setTicketPriceInput(e.target.value)}
                              placeholder="Ex: 2.50"
                              className="bg-background/70"
                              step="0.01"
                              min="0.01"
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="sellerCommission" className="flex items-center">
                               <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                              Comissão do Vendedor (%)
                          </Label>
                          <Input 
                              id="sellerCommission" 
                              type="number" 
                              value={commissionInput}
                              onChange={(e) => setCommissionInput(e.target.value)}
                              placeholder="Ex: 10"
                              className="bg-background/70"
                              min="0"
                              max="100"
                          />
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                      <Button onClick={handleSaveLotteryConfig} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          <Settings className="mr-2 h-4 w-4" /> Salvar Configurações
                      </Button>
                  </CardFooter>
              </Card>

              <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl text-center font-semibold flex items-center justify-center">
                        <PaletteIcon className="mr-2 h-5 w-5" />
                        Tema da Aplicação
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Escolha entre o tema claro ou escuro para a interface.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-6">
                    <ThemeToggleButton />
                </CardContent>
              </Card>
            </div>
          </section>
        );
      case 'cadastrar-sorteio':
        return (
          <section aria-labelledby="draw-submission-heading">
            <h2 id="draw-submission-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <PlusCircle className="mr-3 h-8 w-8 text-primary" />
              Cadastrar Novo Sorteio
            </h2>
            <AdminDrawForm onAddDraw={handleAddDraw} hasWinningTickets={winningTickets.length > 0} />
          </section>
        );
      case 'controles-loteria':
        return (
          <section aria-labelledby="lottery-controls-heading">
            <h2 id="lottery-controls-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
              Controles da Loteria
            </h2>
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-destructive/50">
              <CardHeader>
                <CardTitle className="text-xl text-center font-semibold">
                  Gerenciar Ciclo da Loteria
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground">
                  Esta ação reinicia a loteria, cria um histórico de vendas e expira bilhetes ativos.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="text-base py-3 px-6 shadow-lg hover:shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Rocket className="mr-2 h-5 w-5" /> Iniciar Nova Loteria
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                        Confirmar Nova Loteria?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá salvar um resumo do ciclo de vendas atual do vendedor, limpar todos os sorteios existentes e marcar todos os bilhetes ativos e premiados como expirados.
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStartNewLottery} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Confirmar e Iniciar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </section>
        );
      case 'historico-sorteios':
        return (
          <section aria-labelledby="draw-history-heading">
            <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <History className="mr-3 h-8 w-8 text-primary" />
              Histórico de Sorteios
            </h2>
            <AdminDrawList draws={draws} />
          </section>
        );
      case 'bilhetes-premiados':
        return (
          <section aria-labelledby="winning-tickets-heading">
            <h2 id="winning-tickets-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
              <Trophy className="mr-3 h-8 w-8 text-accent" />
              Bilhetes Premiados ({winningTickets.length})
            </h2>
            {winningTickets.length > 0 ? (
              <TicketList tickets={winningTickets} draws={draws} />
            ) : (
              <div className="text-center py-10 bg-card/50 rounded-lg shadow">
                <Trophy size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">Nenhum bilhete premiado no momento.</p>
              </div>
            )}
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
          <Link href="/" passHref>
            <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:justify-start">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline-block sm:ml-2">Voltar para Home</span>
            </Button>
          </Link>
          <div className="text-center flex-grow">
             <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                Área Administrativa
             </h1>
             <p className="text-lg text-muted-foreground mt-2">Gerenciamento de Sorteios, Bilhetes e Configurações</p>
          </div>
          <div className="w-10 md:hidden"> {/* Placeholder for hamburger button */}
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

      <div className="flex flex-col md:flex-row gap-x-8 gap-y-6 flex-grow mt-8">
        {/* Vertical Menu - Mobile: Overlay, Desktop: Sticky Sidebar */}
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
          </nav>
        </aside>

        {/* Content Area */}
        <main className={cn("flex-grow", isMobileMenuOpen && "md:ml-0")}>
          {renderSectionContent()}
        </main>
      </div>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Admin.
        </p>
      </footer>
    </div>
  );
}
    
