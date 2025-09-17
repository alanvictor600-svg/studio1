
"use client";

import type { FC } from 'react';
import { useMemo, useState, useEffect } from 'react';
import type { Ticket, Draw } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { calculateTicketMatches, countOccurrences } from '@/lib/lottery-utils';
import { Trophy, User, ShoppingCart, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

interface TopTicketsProps {
  draws: Draw[];
}

const TicketSkeleton: FC = () => (
  <li className="relative p-3 rounded-lg bg-background/70 shadow-sm border pb-8">
    <div className="flex items-start gap-4">
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
      <Skeleton className="h-7 w-20 rounded-full" />
    </div>
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-8 rounded-full" />
        ))}
      </div>
    </div>
  </li>
);


export const TopTickets: FC<TopTicketsProps> = ({ draws }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ticketsQuery = query(collection(db, 'tickets'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        setAllTickets(ticketsData);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching tickets for TopTickets: ", error.message);
        setAllTickets([]); // Clear tickets on permission error
        setIsLoading(false);
    });

    return () => unsubscribeTickets();
  }, []);


  const rankedTickets = useMemo(() => {
    if (isLoading || !allTickets || !draws || draws.length === 0) {
      return [];
    }
    
    const relevantTicketsWithMatches = allTickets
      .filter(ticket => ticket.status === 'active' || ticket.status === 'winning')
      .map(ticket => ({
        ...ticket,
        matches: calculateTicketMatches(ticket, draws),
      }));

    const sortedTickets = relevantTicketsWithMatches.sort((a, b) => {
      if (b.matches !== a.matches) {
        return b.matches - a.matches;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedTickets;
  }, [allTickets, draws, isLoading]);

  const filteredTickets = useMemo(() => {
    if (!searchTerm) {
      return rankedTickets;
    }
    return rankedTickets.filter(ticket => {
      const ownerName = ticket.buyerName || ticket.sellerUsername || '';
      return ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [rankedTickets, searchTerm]);

  const drawnNumbersFrequency = useMemo(() => {
    if (!draws || draws.length === 0) {
      return {} as Record<number, number>;
    }
    return countOccurrences(draws.flatMap(draw => draw.numbers));
  }, [draws]);

  if (isLoading) {
    return (
       <Card className="h-full flex flex-col">
          <CardHeader className="p-4 border-b">
            <Skeleton className="h-9 w-full" />
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            <ScrollArea className="h-80 rounded-md">
              <ul className="p-4 space-y-3">
                <TicketSkeleton />
                <TicketSkeleton />
                <TicketSkeleton />
              </ul>
            </ScrollArea>
          </CardContent>
       </Card>
    );
  }

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
                {filteredTickets.map((ticket) => {
                    const isClientTicket = !ticket.sellerUsername;
                    
                    const tempDrawnFrequency = { ...drawnNumbersFrequency };
                    const processedTicketNumbers = ticket.numbers.map(num => {
                      let isMatchedInstance = false;
                      if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
                        isMatchedInstance = true;
                        tempDrawnFrequency[num]--;
                      }
                      return { numberValue: num, isMatched: isMatchedInstance };
                    });
                    
                    const isWinning = ticket.status === 'winning';

                    return (
                    <li key={ticket.id} className={cn(
                      "relative p-3 rounded-lg bg-background/70 shadow-sm border pb-8",
                       isWinning && "bg-accent/20 border-accent/50 ring-2 ring-accent"
                    )}>
                        <div className="flex items-start gap-4">
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2">
                                    {isClientTicket 
                                        ? <User className="h-4 w-4 text-blue-500 flex-shrink-0" title="Cliente" /> 
                                        : <ShoppingCart className="h-4 w-4 text-orange-500 flex-shrink-0" title="Vendedor" />
                                    }
                                    <p className="font-semibold truncate text-foreground text-base">
                                        {ticket.buyerName || `Venda de ${ticket.sellerUsername}`}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={isWinning ? "default" : "secondary"} className={cn(
                              "text-base font-bold py-1 px-3",
                              isWinning && "bg-accent text-accent-foreground"
                            )}>
                              {isWinning && <Trophy className="mr-1.5 h-4 w-4" />}
                              {ticket.matches} Acerto{ticket.matches !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                        <div className="mt-3">
                            <div className="flex flex-wrap gap-1.5">
                                {processedTicketNumbers.map(({ numberValue, isMatched }, index) => (
                                <Badge
                                    key={`${ticket.id}-num-${index}`}
                                    variant="outline"
                                    className={cn(
                                        "font-mono text-xs",
                                        isMatched ? "bg-green-500 text-white border-green-600" : "bg-muted/50 text-muted-foreground",
                                        isMatched && isWinning && "ring-2 ring-yellow-400"
                                    )}
                                >
                                    {numberValue}
                                </Badge>
                                ))}
                            </div>
                        </div>
                        <p className="absolute bottom-2 right-3 text-xs text-muted-foreground/70">
                            ID: #{ticket.id.substring(0,6)}
                        </p>
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
