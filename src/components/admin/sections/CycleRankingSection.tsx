
"use client";

import { useMemo, type FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RankedTicket, Draw } from '@/types';
import { cn } from '@/lib/utils';
import { countOccurrences } from '@/lib/lottery-utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";


interface CycleRankingSectionProps {
  rankedTickets: RankedTicket[];
  draws: Draw[];
}

export const CycleRankingSection: FC<CycleRankingSectionProps> = ({ rankedTickets, draws }) => {
  const { toast } = useToast();

  const drawnNumbersFrequency = useMemo(() => {
    if (!draws || draws.length === 0) {
      return {} as Record<number, number>;
    }
    return countOccurrences(draws.flatMap(draw => draw.numbers));
  }, [draws]);

  const getIsNumberMatched = (num: number, tempDrawnFrequency: Record<number, number>) => {
    if (tempDrawnFrequency[num] && tempDrawnFrequency[num] > 0) {
      tempDrawnFrequency[num]--;
      return true;
    }
    return false;
  };
  
  const handleCopyToClipboard = () => {
    if (rankedTickets.length === 0) {
      toast({ title: "Nenhum dado para copiar", variant: "destructive" });
      return;
    }

    const headers = ['Comprador', 'Vendedor', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', 'Acertos'];
    const rows = rankedTickets.map(ticket => [
      ticket.buyerName || 'N/A',
      ticket.sellerUsername || '-',
      ...ticket.numbers,
      ticket.matches
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      toast({
        title: "Tabela Copiada!",
        description: "Os dados estão prontos para serem colados no Excel.",
        className: "bg-primary text-primary-foreground"
      });
    }, (err) => {
      toast({
        title: "Erro ao Copiar",
        description: "Não foi possível copiar os dados para a área de transferência.",
        variant: "destructive"
      });
      console.error('Could not copy text: ', err);
    });
  };


  return (
    <section aria-labelledby="cycle-ranking-heading">
      <h2 id="cycle-ranking-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <TrendingUp className="mr-3 h-8 w-8 text-primary" />
        Ranking do Ciclo Atual
      </h2>
      <Card className="w-full mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
           <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold">
                Placar Geral de Acertos
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Todos os bilhetes ativos ordenados pela quantidade de acertos.
              </CardDescription>
            </div>
            <Button onClick={handleCopyToClipboard} variant="outline" size="sm" disabled={rankedTickets.length === 0}>
              <Copy className="mr-2 h-4 w-4" /> Copiar para Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/95 z-10">
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Vendedor</TableHead>
                   {Array.from({ length: 10 }, (_, i) => (
                      <TableHead key={i} className="text-center">{`${i + 1}º`}</TableHead>
                   ))}
                  <TableHead className="text-center">Acertos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedTickets.length > 0 ? (
                  rankedTickets.map((ticket) => {
                    const tempDrawnFrequency = { ...drawnNumbersFrequency };
                    return (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.buyerName}</TableCell>
                            <TableCell>{ticket.sellerUsername || '-'}</TableCell>
                            {ticket.numbers.map((num, i) => {
                                const isMatched = getIsNumberMatched(num, tempDrawnFrequency);
                                return (
                                <TableCell key={i} className="text-center">
                                    <Badge
                                    variant={isMatched ? "default" : "outline"}
                                    className={cn(
                                        "font-mono text-xs w-7 h-7 flex items-center justify-center transition-colors",
                                        isMatched && "bg-green-500 text-white"
                                    )}
                                    >
                                    {num}
                                    </Badge>
                                </TableCell>
                                );
                            })}
                            <TableCell className="text-center">
                                <Badge
                                    variant="default"
                                    className="font-mono text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full shadow-lg"
                                >
                                    {ticket.matches}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
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
