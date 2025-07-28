
"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import type { Ticket, Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Award, CircleDot, TimerOff, CalendarDays, User, Phone, Clock, Ban } from 'lucide-react';


interface TicketCardProps {
  ticket: Ticket;
  draws?: Draw[];
}

export const TicketCard: FC<TicketCardProps> = ({ ticket, draws }) => {
  const getStatusProps = () => {
    switch (ticket.status) {
      case 'winning':
        return {
          bgColor: 'bg-accent',
          textColor: 'text-accent-foreground',
          borderColor: 'border-accent',
          Icon: Award,
          label: 'Premiado!',
        };
      case 'awaiting_payment':
        return {
          bgColor: 'bg-orange-400',
          textColor: 'text-orange-900',
          borderColor: 'border-orange-500',
          Icon: Clock,
          label: 'Aguardando Pagamento',
        };
       case 'unpaid':
        return {
          bgColor: 'bg-red-200',
          textColor: 'text-red-900',
          borderColor: 'border-red-400',
          Icon: Ban,
          label: 'Não Pago',
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
    // If the ticket is expired or unpaid, no numbers should be marked as matched.
    if (ticket.status === 'expired' || ticket.status === 'unpaid') {
        return ticket.numbers.map(num => ({ numberValue: num, isMatched: false }));
    }

    const tempDrawnFrequency = { ...drawnNumbersFrequency };
    return ticket.numbers.map(num => {
      let isMatchedInstance = false;
      if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
        isMatchedInstance = true;
        tempDrawnFrequency[num]--;
      }
      return { numberValue: num, isMatched: isMatchedInstance };
    });
  }, [ticket.numbers, ticket.status, drawnNumbersFrequency]);


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
      <CardContent className="flex-grow space-y-3">
        <div>
          <p className="text-sm font-medium mb-1 opacity-90">Números:</p>
          <div className="flex flex-wrap gap-1.5">
            {processedTicketNumbers.map(({ numberValue, isMatched }, index) => (
              <Badge
                key={`${ticket.id}-num-${index}`}
                variant="default"
                className={cn(
                  "text-md font-semibold px-2.5 py-1 shadow-sm",
                  isMatched
                    ? 'bg-green-600 text-white' // Changed to green for matched numbers
                    : (ticket.status === 'winning'
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-primary text-primary-foreground'),
                  isMatched && 'ring-2 ring-yellow-300 dark:ring-yellow-400 ring-offset-2 ring-offset-[hsl(var(--card))]'
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
      {(ticket.buyerName || ticket.buyerPhone) && (
        <CardFooter className={cn("pt-3 pb-4 border-t mt-auto", statusProps.borderColor, `bg-${statusProps.bgColor}/20`)}>
          <div className="space-y-1 w-full">
            {ticket.buyerName && (
              <div className="flex items-center text-xs opacity-90">
                <User size={14} className="mr-1.5 shrink-0" />
                <span className="font-medium mr-1">Comprador:</span>
                <span className="truncate">{ticket.buyerName}</span>
              </div>
            )}
            {ticket.buyerPhone && (
              <div className="flex items-center text-xs opacity-90">
                <Phone size={14} className="mr-1.5 shrink-0" />
                <span className="font-medium mr-1">Telefone:</span>
                <span>{ticket.buyerPhone}</span>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
