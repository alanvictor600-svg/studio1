
"use client";

import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RankedTicket } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface CycleRankingSectionProps {
  rankedTickets: RankedTicket[];
}

const fallbackCopyTextToClipboard = (text: string, toast: (options: any) => void) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      toast({ title: "Tabela Copiada!", description: "Os dados estão prontos para serem colados no Excel.", className: "bg-primary text-primary-foreground" });
    } else {
      toast({ title: "Falha ao copiar", description: "Não foi possível copiar automaticamente. Por favor, copie manualmente.", variant: "destructive" });
    }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    toast({ title: "Erro ao copiar", description: "Não foi possível copiar os dados. Por favor, copie manualmente.", variant: "destructive" });
  }

  document.body.removeChild(textArea);
};

export const CycleRankingSection: FC<CycleRankingSectionProps> = ({ rankedTickets }) => {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (rankedTickets.length === 0) {
      toast({ title: "Nenhum dado para copiar", description: "Não há bilhetes para copiar.", variant: "destructive" });
      return;
    }

    const headers = ['Comprador', 'Vendedor', ...Array.from({ length: 10 }, (_, i) => `N${i + 1}`), 'Acertos'];
    const rows = rankedTickets.map(ticket => [
      ticket.buyerName,
      ticket.sellerUsername || '-',
      ...ticket.numbers,
      ticket.matches
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsvContent).then(() => {
        toast({ title: "Tabela Copiada!", description: "Os dados estão prontos para serem colados no Excel.", className: "bg-primary text-primary-foreground" });
      }).catch(err => {
        console.error('Could not copy text using navigator: ', err);
        fallbackCopyTextToClipboard(tsvContent, toast);
      });
    } else {
      fallbackCopyTextToClipboard(tsvContent, toast);
    }
  };

  return (
    <section aria-labelledby="cycle-ranking-heading">
      <h2 id="cycle-ranking-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <TrendingUp className="mr-3 h-8 w-8 text-primary" />
        Ranking do Ciclo Atual
      </h2>
      <Card className="w-full mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">
                Placar Geral de Acertos
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Todos os bilhetes ativos ordenados pela quantidade de acertos.
              </CardDescription>
            </div>
             <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
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
                  rankedTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.buyerName}</TableCell>
                            <TableCell>{ticket.sellerUsername || '-'}</TableCell>
                            {ticket.numbers.map((num, i) => (
                                <TableCell key={i} className="text-center">
                                    <Badge
                                    variant={"outline"}
                                    className={cn(
                                        "font-mono text-xs w-7 h-7 flex items-center justify-center transition-colors"
                                    )}
                                    >
                                    {num}
                                    </Badge>
                                </TableCell>
                            ))}
                            <TableCell className="text-center">
                                <Badge
                                    variant="default"
                                    className={cn(
                                        "font-mono text-lg font-bold h-8 w-8 flex items-center justify-center rounded-full shadow-lg",
                                        ticket.matches === Math.max(...rankedTickets.map(t => t.matches)) && ticket.matches > 0 && "bg-yellow-500 text-black",
                                    )}
                                >
                                    {ticket.matches}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
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
