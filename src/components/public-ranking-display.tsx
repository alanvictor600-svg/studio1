
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


interface PublicRankingEntry {
  buyerName: string;
  matches: number;
  ticketId: string;
  numbers: number[];
}

interface PublicRankingDisplayProps {
  ranking: PublicRankingEntry[];
}

export const PublicRankingDisplay: FC<PublicRankingDisplayProps> = ({ ranking }) => {

  if (!ranking || ranking.length === 0) {
    return (
      <Card className="h-full flex flex-col shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6" /> Ranking Geral
           </CardTitle>
            <CardDescription className="text-center">
              Acompanhe os bilhetes com mais acertos em tempo real.
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
    <Card className="h-full flex flex-col shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-6 w-6" /> Ranking Geral de Acertos
           </CardTitle>
           <CardDescription className="text-center">
              Placar de todos os bilhetes ativos no ciclo atual, ordenado por acertos.
           </CardDescription>
        </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/95 z-10">
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="w-[100px] text-center">Acertos</TableHead>
                  <TableHead className="text-center">Números do Bilhete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {ranking.map((ticket, index) => (
                    <TableRow key={ticket.ticketId} className={cn(
                        index === 0 && "bg-yellow-500/10 hover:bg-yellow-500/20",
                        index === 1 && "bg-gray-500/10 hover:bg-gray-500/20",
                        index === 2 && "bg-orange-600/10 hover:bg-orange-600/20",
                    )}>
                      <TableCell className="font-medium">{ticket.buyerName}</TableCell>
                      <TableCell className="text-center">
                         <Badge
                            variant="default"
                            className="font-mono text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full shadow-lg"
                        >
                            {ticket.matches}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {ticket.numbers && ticket.numbers.map((num, i) => (
                                <Badge key={i} variant="outline" className="font-mono text-xs w-7 h-7 flex items-center justify-center">{num}</Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
      </CardContent>
    </Card>
  );
};
