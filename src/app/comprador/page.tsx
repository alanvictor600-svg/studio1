
"use client";

import { useState, useEffect } from 'react';
import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import type { Ticket, Draw } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';

const COMPRADOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarCompradorTickets';
const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';

export default function CompradorPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Initial load of draws and tickets, and process tickets
  useEffect(() => {
    setIsClient(true);
    const storedDrawsRaw = localStorage.getItem(DRAWS_STORAGE_KEY);
    const localDraws = storedDrawsRaw ? JSON.parse(storedDrawsRaw) : [];
    setDraws(localDraws);

    let initialTickets: Ticket[] = [];
    const storedTicketsRaw = localStorage.getItem(COMPRADOR_TICKETS_STORAGE_KEY);
    if (storedTicketsRaw) {
      initialTickets = JSON.parse(storedTicketsRaw);
    } else {
      // Add default ticket if none exist for comprador
      initialTickets = [
        { id: uuidv4(), numbers: [1,2,3,4,5,6,7,8,9,10].sort((a,b)=>a-b), status: 'active', createdAt: new Date().toISOString() },
      ];
    }
    // Set initial tickets; the processing effect will run after this.
    // The subsequent effect will process these tickets against draws and save them.
    setTickets(initialTickets);

  }, [isClient]);

  // Process tickets based on draws and save updated tickets to localStorage
  useEffect(() => {
    if (isClient) {
      // Ensure tickets state is not empty before processing, especially if initial load resulted in an empty array
      // and we don't want to overwrite localStorage with an empty array unless it was truly the result of processing.
      if (tickets.length > 0 || localStorage.getItem(COMPRADOR_TICKETS_STORAGE_KEY)) {
          const processedTickets = updateTicketStatusesBasedOnDraws(tickets, draws);

          if (JSON.stringify(processedTickets) !== JSON.stringify(tickets)) {
            setTickets(processedTickets); // Update state if statuses changed
          }
          // Always save the latest processed tickets to localStorage to ensure consistency
          localStorage.setItem(COMPRADOR_TICKETS_STORAGE_KEY, JSON.stringify(processedTickets));
      }
    }
  }, [tickets, draws, isClient]);


  const handleAddTicket = (newNumbers: number[]) => {
    const newTicket: Ticket = {
      id: uuidv4(),
      numbers: newNumbers.sort((a, b) => a - b),
      status: 'active', // Initial status, will be updated by the useEffect that processes tickets
      createdAt: new Date().toISOString(),
    };
    setTickets(prevTickets => [newTicket, ...prevTickets]); // Add new ticket, effect will process and save
  };

  // Removed handleUpdateTicketStatus function

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando área do comprador...</p>
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
                Comprar Bilhetes
             </h1>
             <p className="text-lg text-muted-foreground mt-2">Sua sorte começa aqui!</p>
          </div>
           <div className="w-[150px]"></div> {/* Spacer to balance the layout */}
        </div>
      </header>

      <main className="space-y-12 flex-grow">
        <section aria-labelledby="ticket-selection-heading">
          <h2 id="ticket-selection-heading" className="sr-only">Seleção de Bilhetes</h2>
          <TicketSelectionForm onAddTicket={handleAddTicket} />
        </section>

        <section aria-labelledby="ticket-management-heading" className="mt-16">
          <h2 id="ticket-management-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
            Meus Bilhetes
          </h2>
          <TicketList
            tickets={tickets}
            draws={draws}
            // Removed onUpdateTicketStatus prop
          />
        </section>
      </main>

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
