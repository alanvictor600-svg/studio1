
"use client";

import type { FC } from 'react';
import { useMemo, useState } from 'react';
import type { Ticket, Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateTicketMatches } from '@/lib/lottery-utils';
import { Trophy, User, ShoppingCart, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface TopTicketsProps {
  tickets: Ticket[];
  draws: Draw[];
}

export const TopTickets: FC<TopTicketsProps> = ({ tickets, draws }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const rankedTickets = useMemo(() => {
    if (!tickets || !draws || draws.length === 0) {
      return [];
    }
    
    const activeTicketsWithMatches = tickets
      .filter(ticket => ticket.status === 'active')
      .map(ticket => ({
        ...ticket,
        matches: calculateTicketMatches(ticket, draws),
      }));

    const sortedTickets = activeTicketsWithMatches.sort((a, b) => {
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedTickets;
  }, [tickets, draws]);

  const filteredTickets = useMemo(() => {
    if (!searchTerm) {
      return rankedTickets;
    }
    return rankedTickets.filter(ticket => {
      const ownerName = ticket.buyerName || ticket.sellerUsername || '';
      return ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [rankedTickets, searchTerm]);

  if (rankedTickets.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
           <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum bilhete ativo para classificar ainda.</p>
          <p className="text-sm text-muted-foreground/80">Faça sua aposta para aparecer aqui!</p>
        </CardContent>
      </Card>
    );
  }

  const getRankColor = (rank: number) => {
    if (rank === 0) return 'bg-yellow-400 text-yellow-900';
    if (rank === 1) return 'bg-gray-300 text-gray-800';
    if (rank === 2) return 'bg-yellow-600/70 text-yellow-100';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow">
        <ScrollArea className="h-80 rounded-md">
            {filteredTickets.length > 0 ? (
                <ul className="p-4 space-y-3">
                {filteredTickets.map((ticket, index) => {
                    const isClientTicket = !ticket.sellerUsername;
                    // Use the original index from the main ranked list for coloring
                    const originalIndex = rankedTickets.findIndex(t => t.id === ticket.id);
                    return (
                    <li key={ticket.id} className="flex items-center gap-4 p-3 rounded-lg bg-background/70 shadow-sm">
                        <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold", getRankColor(originalIndex))}>
                            {originalIndex + 1}
                        </div>
                        <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                            {isClientTicket 
                                ? <User className="h-4 w-4 text-blue-500 flex-shrink-0" title="Cliente" /> 
                                : <ShoppingCart className="h-4 w-4 text-orange-500 flex-shrink-0" title="Vendedor" />
                            }
                            <p className="font-semibold truncate text-foreground text-sm">
                                {ticket.buyerName || `Venda de ${ticket.sellerUsername}`}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            ID: #{ticket.id.substring(0,6)}
                        </p>
                        </div>
                        <Badge variant="secondary" className="text-base font-bold py-1 px-3">
                        {ticket.matches} Acerto{ticket.matches !== 1 ? 's' : ''}
                        </Badge>
                    </li>
                    )
                })}
                </ul>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum bilhete encontrado.</p>
                    <p className="text-sm text-muted-foreground/80">Tente um termo de busca diferente.</p>
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
