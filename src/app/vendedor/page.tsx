
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminDrawList } from '@/components/admin-draw-list';
import { TicketList } from '@/components/ticket-list';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import type { Draw, Ticket } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, ClipboardList, Ticket as TicketIconLucide, BarChart3, PlusCircle } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from "@/hooks/use-toast";

const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const COMPRADOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarCompradorTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets';

export default function VendedorPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [compradorTicketsForSummary, setCompradorTicketsForSummary] = useState<Ticket[]>([]);
  const [vendedorManagedTickets, setVendedorManagedTickets] = useState<Ticket[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  // Initial load of client status and draws
  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
  }, []);

  // Load and process tickets once client-side and when draws or vendedorManagedTickets change
  useEffect(() => {
    if (isClient) {
      // Load comprador tickets for summary
      const storedCompradorTickets = localStorage.getItem(COMPRADOR_TICKETS_STORAGE_KEY);
      let initialCompradorTickets: Ticket[] = [];
      if (storedCompradorTickets) {
        initialCompradorTickets = JSON.parse(storedCompradorTickets);
      }
      const processedCompradorTickets = updateTicketStatusesBasedOnDraws(initialCompradorTickets, draws);
      if(JSON.stringify(processedCompradorTickets) !== JSON.stringify(compradorTicketsForSummary)){
        setCompradorTicketsForSummary(processedCompradorTickets);
      }
      

      // Load vendedor tickets
      const storedVendedorTickets = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
      let initialVendedorTickets: Ticket[] = [];
      if (storedVendedorTickets) {
        initialVendedorTickets = JSON.parse(storedVendedorTickets);
      }
      // Important: Process these tickets *before* setting them to state to avoid loops if updateTicketStatusesBasedOnDraws modifies them.
      const processedVendedorTickets = updateTicketStatusesBasedOnDraws(initialVendedorTickets, draws);
       if (JSON.stringify(processedVendedorTickets) !== JSON.stringify(vendedorManagedTickets) || initialVendedorTickets.length !== vendedorManagedTickets.length) {
         setVendedorManagedTickets(processedVendedorTickets);
       }

    }
  }, [isClient, draws]); // Removed vendedorManagedTickets from dependency to avoid loop on its own update

  // Save vendedorManagedTickets to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(VENDEDOR_TICKETS_STORAGE_KEY, JSON.stringify(vendedorManagedTickets));
      // Re-process vendedor tickets based on draws after any update
      const processedVendedorTickets = updateTicketStatusesBasedOnDraws(vendedorManagedTickets, draws);
      if(JSON.stringify(processedVendedorTickets) !== JSON.stringify(vendedorManagedTickets)){
        setVendedorManagedTickets(processedVendedorTickets);
      }
    }
  }, [vendedorManagedTickets, draws, isClient]); // Add draws here to re-process if draws change.


  const handleAddSellerTicket = (numbers: number[], buyerName: string, buyerPhone: string) => {
    const newTicket: Ticket = {
      id: uuidv4(),
      numbers: numbers.sort((a, b) => a - b),
      status: 'active', // Will be updated by effect
      createdAt: new Date().toISOString(),
      buyerName,
      buyerPhone,
    };
    setVendedorManagedTickets(prevTickets => [newTicket, ...prevTickets]);
    // Toast is handled in the form component
  };

  const isLotteryActive = draws.length > 0;

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Área do Vendedor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10">
        <div className="flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>
          <div className="text-center flex-grow">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
              Área do Vendedor
            </h1>
            <p className="text-lg text-muted-foreground mt-2">Painel de Controle e Vendas</p>
          </div>
          <div className="w-[150px]"></div> {/* Spacer to balance layout */}
        </div>
      </header>

      <main className="space-y-12 flex-grow">
        {/* Ticket Creation Section for Seller */}
        <section aria-labelledby="seller-ticket-creation-heading">
          <h2 id="seller-ticket-creation-heading" className="text-3xl font-bold text-primary mb-6 text-center flex items-center justify-center">
            <PlusCircle className="mr-3 h-7 w-7" /> Registrar Nova Venda de Bilhete
          </h2>
          <SellerTicketCreationForm onAddTicket={handleAddSellerTicket} isLotteryActive={isLotteryActive} />
        </section>

        {/* Dashboard Summary Section */}
        <section aria-labelledby="dashboard-summary-heading" className="mt-16">
          <h2 id="dashboard-summary-heading" className="text-3xl font-bold text-primary mb-6 text-center">
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
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bilhetes Vendidos por Mim
                </CardTitle>
                <TicketIconLucide className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{vendedorManagedTickets.length}</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-card text-card-foreground border-border hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bilhetes (App Compradores)
                </CardTitle>
                <TicketIconLucide className="h-5 w-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{compradorTicketsForSummary.length}</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Seller's Managed Tickets Section */}
        <section aria-labelledby="seller-ticket-list-heading" className="mt-16">
          <h2 id="seller-ticket-list-heading" className="text-3xl font-bold text-primary mb-8 text-center">
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

        {/* Draws Section */}
        <section aria-labelledby="seller-draw-history-heading" className="mt-16">
          <h2 id="seller-draw-history-heading" className="text-3xl font-bold text-primary mb-8 text-center">
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
        
        {/* Placeholder for future reports/analytics */}
        <section aria-labelledby="reports-heading" className="mt-16">
          <h2 id="reports-heading" className="text-3xl font-bold text-primary mb-8 text-center">
            Relatórios e Análises
          </h2>
          <div className="text-center py-10 bg-card/50 rounded-lg shadow">
            <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              Em breve: relatórios detalhados de vendas e desempenho.
            </p>
          </div>
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
