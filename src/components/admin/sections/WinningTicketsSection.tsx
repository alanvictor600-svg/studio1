
"use client";

import type { FC } from 'react';
import { Trophy } from 'lucide-react';
import { TicketList } from '@/components/ticket-list';
import type { Ticket, Draw } from '@/types';

interface WinningTicketsSectionProps {
  winningTickets: Ticket[];
  draws: Draw[];
}

export const WinningTicketsSection: FC<WinningTicketsSectionProps> = ({ winningTickets, draws }) => {
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
};
