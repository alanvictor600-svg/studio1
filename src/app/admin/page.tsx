
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Draw, Ticket, LotteryConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, Rocket, AlertTriangle, Settings, DollarSign, Percent, ListChecks, PlusCircle, ShieldCheck, History, BarChart3 } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const LOTTERY_CONFIG_STORAGE_KEY = 'bolaoPotiguarLotteryConfig';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2, // Default price R$2.00
  sellerCommissionPercentage: 10, // Default 10%
};

export default function AdminPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states for lottery config
  const [ticketPriceInput, setTicketPriceInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.ticketPrice.toString());
  const [commissionInput, setCommissionInput] = useState<string>(DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage.toString());

  // Initial load of draws, tickets, and lottery config
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

  // Process tickets based on draws and save updated tickets to localStorage
  useEffect(() => {
    if (isClient) {
      const processedTickets = updateTicketStatusesBasedOnDraws(allTickets, draws);
      if (JSON.stringify(processedTickets) !== JSON.stringify(allTickets)) {
         setAllTickets(processedTickets);
      }
      localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(processedTickets));
    }
  }, [allTickets, draws, isClient]);

  // Save draws to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(DRAWS_STORAGE_KEY, JSON.stringify(draws));
    }
  }, [draws, isClient]);

  // Save lottery config to localStorage
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

  const handleStartNewLottery = () => {
    setDraws([]);
    setAllTickets(prevTickets =>
      prevTickets.map(ticket => {
        if (ticket.status === 'active' || ticket.status === 'winning') {
          return { ...ticket, status: 'expired' as Ticket['status'] };
        }
        return ticket;
      })
    );
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

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Admin...</p>
      </div>
    );
  }

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
          <div className="w-[150px] sm:w-[180px] md:w-[200px]"></div> 
        </div>
      </header>

      <nav className="mb-10 py-3 bg-card/70 backdrop-blur-sm rounded-lg shadow-md sticky top-4 z-10">
        <ul className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 sm:gap-x-4">
          <li>
            <Link href="#admin-lottery-settings-section" passHref>
              <Button variant="ghost" className="text-primary hover:bg-primary/10 text-xs sm:text-sm">
                <Settings className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Configurações
              </Button>
            </Link>
          </li>
          <li>
            <Link href="#admin-draw-submission-section" passHref>
              <Button variant="ghost" className="text-primary hover:bg-primary/10 text-xs sm:text-sm">
                <PlusCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Cadastrar Sorteio
              </Button>
            </Link>
          </li>
          <li>
            <Link href="#admin-lottery-controls-section" passHref>
              <Button variant="ghost" className="text-primary hover:bg-primary/10 text-xs sm:text-sm">
                <ShieldCheck className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Controles
              </Button>
            </Link>
          </li>
          <li>
            <Link href="#admin-draw-history-section" passHref>
              <Button variant="ghost" className="text-primary hover:bg-primary/10 text-xs sm:text-sm">
                <History className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Histórico Sorteios
              </Button>
            </Link>
          </li>
          <li>
            <Link href="#admin-winning-tickets-section" passHref>
              <Button variant="ghost" className="text-primary hover:bg-primary/10 text-xs sm:text-sm">
                <Trophy className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> Bilhetes Premiados
              </Button>
            </Link>
          </li>
        </ul>
      </nav>

      <main className="space-y-12 flex-grow">
        <section id="admin-lottery-settings-section" aria-labelledby="lottery-settings-heading" className="scroll-mt-24">
            <h2 id="lottery-settings-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
                <Settings className="mr-3 h-8 w-8 text-primary" />
                Configurações da Loteria
            </h2>
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
        </section>
        
        <section id="admin-draw-submission-section" aria-labelledby="draw-submission-heading" className="mt-12 scroll-mt-24">
          <h2 id="draw-submission-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
            <PlusCircle className="mr-3 h-8 w-8 text-primary" />
            Cadastrar Novo Sorteio
          </h2>
          <AdminDrawForm onAddDraw={handleAddDraw} hasWinningTickets={winningTickets.length > 0} />
        </section>

        <section id="admin-lottery-controls-section" aria-labelledby="lottery-controls-heading" className="mt-12 scroll-mt-24">
          <h2 id="lottery-controls-heading" className="sr-only">Controles da Loteria</h2> {/* Changed from text-3xl to sr-only as it's now visually represented by the card */}
          <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-destructive/50">
            <CardHeader>
              <CardTitle className="text-xl text-center font-bold text-accent flex items-center justify-center">
                <ShieldCheck className="mr-3 h-7 w-7" />
                Controles da Loteria
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Gerenciar o ciclo da loteria.
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
                      Esta ação irá limpar todos os sorteios existentes e marcar todos os bilhetes ativos e premiados como expirados.
                      A comissão dos vendedores para o ciclo atual será baseada nos bilhetes ativos antes desta ação.
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

        <section id="admin-draw-history-section" aria-labelledby="draw-history-heading" className="mt-16 scroll-mt-24">
          <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
            <History className="mr-3 h-8 w-8 text-primary" />
            Histórico de Sorteios
          </h2>
          <AdminDrawList draws={draws} />
        </section>

        <section id="admin-winning-tickets-section" aria-labelledby="winning-tickets-heading" className="mt-16 scroll-mt-24">
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
      </main>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Admin.
        </p>
      </footer>
    </div>
  );
}
