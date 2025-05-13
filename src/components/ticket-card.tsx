
"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import type { Ticket, Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button'; // For dev buttons
import { Award, CircleDot, TimerOff, CalendarDays } from 'lucide-react';


interface TicketCardProps {
  ticket: Ticket;
  onUpdateTicketStatus?: (ticketId: string, newStatus: Ticket['status']) => void; // Optional for dev/demo
  draws?: Draw[]; // Added to receive draw information
}

export const TicketCard: FC<TicketCardProps> = ({ ticket, onUpdateTicketStatus, draws }) => {
  const getStatusProps = () => {
    switch (ticket.status) {
      case 'winning':
        return {
          bgColor: 'bg-accent', // Crimson
          textColor: 'text-accent-foreground',
          borderColor: 'border-accent',
          Icon: Award,
          label: 'Premiado!',
        };
      case 'expired':
        return {
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
          borderColor: 'border-muted-foreground/50',
          Icon: TimerOff,
          label: 'Expirado',
        };
      case 'active':
      default:
        return {
          bgColor: 'bg-secondary',
          textColor: 'text-secondary-foreground',
          borderColor: 'border-secondary-foreground/30',
          Icon: CircleDot,
          label: 'Ativo',
        };
    }
  };

  const statusProps = getStatusProps();

  const drawnNumbersFrequency = useMemo(() => {
    if (!draws || draws.length === 0) {
      return {} as Record<number, number>;
    }
    const frequency: Record<number, number> = {};
    for (const draw of draws) {
      for (const num of draw.numbers) {
        frequency[num] = (frequency[num] || 0) + 1;
      }
    }
    return frequency;
  }, [draws]);

  const processedTicketNumbers = useMemo(() => {
    const tempDrawnFrequency = { ...drawnNumbersFrequency };
    return ticket.numbers.map(num => {
      let isMatchedInstance = false;
      if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
        isMatchedInstance = true;
        tempDrawnFrequency[num]--;
      }
      return { numberValue: num, isMatched: isMatchedInstance };
    });
  }, [ticket.numbers, drawnNumbersFrequency]);


  return (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between h-full",
      statusProps.bgColor,
      statusProps.textColor,
      `border-2 ${statusProps.borderColor}`
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Bilhete <span className="font-mono text-sm opacity-80">#{ticket.id.substring(0, 6)}</span></span>
          <Badge variant="outline" className={cn("text-sm", statusProps.textColor, `border-${statusProps.borderColor}`, `bg-${statusProps.bgColor}/50`)}>
            <statusProps.Icon className="mr-1.5 h-4 w-4" />
            {statusProps.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <p className="text-sm font-medium mb-1 opacity-90">Números:</p>
          <div className="flex flex-wrap gap-1.5">
            {processedTicketNumbers.map(({ numberValue, isMatched }, index) => (
              <Badge
                key={`${ticket.id}-num-${index}`} // Ensure unique key for each number instance
                variant="default" 
                className={cn(
                  "text-md font-semibold px-2.5 py-1 shadow-sm",
                  isMatched
                    ? 'bg-accent text-accent-foreground' // Highlight for matched numbers
                    : (ticket.status === 'winning' // Style for non-matched numbers based on ticket status
                        ? 'bg-primary-foreground text-primary' 
                        : 'bg-primary text-primary-foreground'),
                  isMatched && 'ring-2 ring-yellow-300 dark:ring-yellow-400 ring-offset-2 ring-offset-[hsl(var(--card))]' // Ring for matched numbers
                )}
              >
                {numberValue}
              </Badge>
            ))}
          </div>
        </div>
        <div className="text-xs opacity-80 flex items-center">
          <CalendarDays size={14} className="mr-1.5" />
          Criado em: {format(parseISO(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </CardContent>
      {onUpdateTicketStatus && ( // Dev buttons for status change
        <CardFooter className="pt-3 flex gap-2 justify-end border-t border-current/20">
          {ticket.status !== 'active' && <Button size="sm" variant="ghost" className="text-xs" onClick={() => onUpdateTicketStatus(ticket.id, 'active')}>Marcar Ativo</Button>}
          {ticket.status !== 'winning' && <Button size="sm" variant="ghost" className="text-xs" onClick={() => onUpdateTicketStatus(ticket.id, 'winning')}>Marcar Premiado</Button>}
          {ticket.status !== 'expired' && <Button size="sm" variant="ghost" className="text-xs" onClick={() => onUpdateTicketStatus(ticket.id, 'expired')}>Marcar Expirado</Button>}
        </CardFooter>
      )}
    </Card>
  );
};

