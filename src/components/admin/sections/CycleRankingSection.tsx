
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RankedTicket } from '@/types';
import { cn } from '@/lib/utils';

interface CycleRankingSectionProps {
  rankedTickets: RankedTicket[];
}

export const CycleRankingSection: FC<CycleRankingSectionProps> = ({ rankedTickets }) => {
  return (
    <section aria-labelledby="cycle-ranking-heading">
      <h2 id="cycle-ranking-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <TrendingUp className="mr-3 h-8 w-8 text-primary" />
        Ranking do Ciclo Atual
      </h2>
      <Card className="w-full mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-center font-semibold">
            Placar Geral de Acertos
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Todos os bilhetes ativos ordenados pela quantidade de acertos.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {rankedTickets.length > 0 ? (
                  rankedTickets.map((ticket, index) => (
                    <TableRow key={ticket.id} className={cn(
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
                            {ticket.numbers.map((num, i) => (
                                <Badge key={i} variant="outline" className="font-mono text-xs w-7 h-7 flex items-center justify-center">{num}</Badge>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Nenhum bilhete ativo no ciclo atual para exibir no ranking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  );
};
