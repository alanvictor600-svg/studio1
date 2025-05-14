
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Draw, Ticket } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, Rocket, AlertTriangle } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets'; // Renamed key
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';

export default function AdminPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  // Initial load of draws and tickets
  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
    const storedTickets = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY); // Using renamed key
    if (storedTickets) {
      setAllTickets(JSON.parse(storedTickets));
    }
  }, []); 

  // Process tickets based on draws and save updated tickets to localStorage
  useEffect(() => {
    if (isClient) {
      const processedTickets = updateTicketStatusesBasedOnDraws(allTickets, draws);
      
      if (JSON.stringify(processedTickets) !== JSON.stringify(allTickets)) {
         setAllTickets(processedTickets);
      }
      localStorage.setItem(CLIENTE_TICKETS_STORAGE_KEY, JSON.stringify(processedTickets)); // Using renamed key
    }
  }, [allTickets, draws, isClient]);

  // Save draws to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(DRAWS_STORAGE_KEY, JSON.stringify(draws));
    }
  }, [draws, isClient]);

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


  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Admin...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10">
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
             <p className="text-lg text-muted-foreground mt-2">Gerenciamento de Sorteios e Bilhetes Premiados</p>
          </div>
          <div className="w-[150px]"></div> 
        </div>
      </header>

      <main className="space-y-12 flex-grow">
        <section aria-labelledby="draw-submission-heading">
          <h2 id="draw-submission-heading" className="sr-only">Cadastrar Novo Sorteio</h2>
          <AdminDrawForm onAddDraw={handleAddDraw} hasWinningTickets={winningTickets.length > 0} />
        </section>

        <section aria-labelledby="lottery-controls-heading" className="mt-12">
          <h2 id="lottery-controls-heading" className="sr-only">Controles da Loteria</h2>
          <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm border-destructive/50">
            <CardHeader>
              <CardTitle className="text-xl text-center font-bold text-accent">Controles da Loteria</CardTitle>
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

        <section aria-labelledby="draw-history-heading" className="mt-16">
          <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
            Histórico de Sorteios
          </h2>
          <AdminDrawList draws={draws} />
        </section>

        <section aria-labelledby="winning-tickets-heading" className="mt-16">
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
