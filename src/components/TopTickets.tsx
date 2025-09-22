
"use client";

import type { FC } from 'react';
import type { Ticket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, TrendingUp, Medal, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';

interface RankedTicket extends Ticket {
  matches: number;
}

interface TopTicketsProps {
  rankedTickets: RankedTicket[];
}

// Helper to get initials from a name
const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const TopTickets: FC<TopTicketsProps> = ({ rankedTickets }) => {

  if (!rankedTickets || rankedTickets.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
              <Star className="h-6 w-6" /> Ranking de Acertos
           </CardTitle>
            <CardDescription className="text-center">
              Os bilhetes com mais acertos aparecerão aqui.
           </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">Aguardando os primeiros acertos do ciclo para exibir o ranking.</p>
          <p className="text-xs text-muted-foreground/80 mt-1">Faça sua aposta e entre na disputa!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
       <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6" /> Ranking de Acertos
           </CardTitle>
           <CardDescription className="text-center">
              Top 5 bilhetes com mais números sorteados no ciclo atual.
           </CardDescription>
        </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="space-y-4">
            {rankedTickets.map((ticket, index) => (
                <div key={ticket.id} className={cn(
                    "flex items-center gap-4 p-3 rounded-lg shadow-sm transition-all",
                     index === 0 && "bg-yellow-400/20 border-2 border-yellow-500",
                     index === 1 && "bg-gray-400/20 border border-gray-500",
                     index === 2 && "bg-orange-600/20 border border-orange-700",
                     index > 2 && "bg-muted/50"
                )}>
                    <Medal className={cn(
                        "h-8 w-8",
                        index === 0 && "text-yellow-500",
                        index === 1 && "text-gray-500",
                        index === 2 && "text-orange-700",
                        index > 2 && "text-muted-foreground"
                    )} />
                    <Avatar className="h-10 w-10 border">
                        <AvatarFallback className={cn(
                             index === 0 && "bg-yellow-500/80 text-white",
                             index === 1 && "bg-gray-500/80 text-white",
                             index === 2 && "bg-orange-700/80 text-white",
                        )}>
                            {getInitials(ticket.buyerName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-foreground truncate">
                           {ticket.buyerName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                            ID: #{ticket.id.substring(0, 8)}
                        </p>
                    </div>
                     <Badge
                        variant="default"
                        className={cn(
                            "font-mono text-lg font-bold h-10 w-10 flex items-center justify-center rounded-full shadow-lg border-2",
                            "bg-primary text-primary-foreground"
                        )}
                    >
                        {ticket.matches}
                    </Badge>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

    