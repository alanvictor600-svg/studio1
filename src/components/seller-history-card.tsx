
"use client";

import type { FC } from 'react';
import type { SellerHistoryEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Ticket, DollarSign, Percent } from 'lucide-react';

interface SellerHistoryCardProps {
  historyEntry: SellerHistoryEntry;
}

export const SellerHistoryCard: FC<SellerHistoryCardProps> = ({ historyEntry }) => {
  return (
    <Card className="shadow-lg bg-card/90 backdrop-blur-sm flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ciclo Encerrado em
        </CardTitle>
        <CardDescription className="text-base font-semibold !mt-1">
          {format(parseISO(historyEntry.endDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
         <div className="flex items-center justify-between p-3 rounded-lg bg-background shadow-inner">
            <div className="flex items-center gap-3">
                <Ticket className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium text-foreground">Bilhetes Vendidos</span>
            </div>
            <span className="font-bold text-lg text-foreground">{historyEntry.activeTicketsCount}</span>
        </div>
         <div className="flex items-center justify-between p-3 rounded-lg bg-background shadow-inner">
            <div className="flex items-center gap-3">
                 <DollarSign className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium text-foreground">Total Arrecadado</span>
            </div>
            <span className="font-bold text-lg text-green-600 dark:text-green-500">
                R$ {historyEntry.totalRevenue.toFixed(2).replace('.', ',')}
            </span>
        </div>
         <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 shadow-inner">
             <div className="flex items-center gap-3">
                <Percent className="h-6 w-6 text-primary" />
                <span className="font-medium text-primary">Sua Comissão</span>
            </div>
            <span className="font-bold text-xl text-primary">
                R$ {historyEntry.totalCommission.toFixed(2).replace('.', ',')}
            </span>
        </div>
      </CardContent>
    </Card>
  );
};
