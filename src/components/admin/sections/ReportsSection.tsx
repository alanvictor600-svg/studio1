
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FinancialChart } from '@/components/financial-chart';
import type { AdminHistoryEntry, Ticket, Draw } from '@/types';
import type { FinancialReport } from '@/lib/reports';
import { PieChart, Users, DollarSign, Percent, Trophy, BookText, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface ReportsSectionProps {
  financialReport: FinancialReport;
  adminHistory: AdminHistoryEntry[];
  allTickets: Ticket[];
  draws: Draw[];
}

export const ReportsSection: FC<ReportsSectionProps> = ({ financialReport, adminHistory, allTickets, draws }) => {
  const { toast } = useToast();

  const handleDownloadExcel = () => {
    const activeTickets = allTickets.filter(t => t.status === 'active' || t.status === 'winning');
    
    if (activeTickets.length === 0) {
      toast({ title: "Nenhum dado para baixar", description: "Não há bilhetes ativos ou premiados para exportar.", variant: "destructive" });
      return;
    }

    const headers = ['Jogador', 'Cambista', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];
    
    const data = activeTickets.map(ticket => {
      const ticketNumbers = ticket.numbers.slice(0, 10);
      while(ticketNumbers.length < 10) {
        ticketNumbers.push(''); // preenche com vazio se tiver menos de 10
      }

      const buyerName = ticket.buyerName || 'N/A';
      const sellerUsername = ticket.sellerUsername || '-';

      return [
          buyerName,
          sellerUsername,
          ...ticketNumbers
      ];
    });

    try {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bilhetes");
      
      // Ajusta a largura das colunas
      const colWidths = headers.map((header, i) => ({ wch: (i < 2) ? 25 : (header.length > 5 ? header.length : 5) }));
      worksheet['!cols'] = colWidths;

      // Gera o arquivo e inicia o download
      XLSX.writeFile(workbook, `bilhetes_bolao_potiguar_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({ title: "Download Iniciado", description: "O arquivo Excel com os bilhetes está sendo baixado.", className: "bg-primary text-primary-foreground" });
    } catch (e) {
      console.error("Erro ao gerar arquivo Excel:", e);
      toast({ title: "Erro ao Exportar", description: "Não foi possível gerar o arquivo Excel.", variant: "destructive" });
    }
  };

  return (
    <section aria-labelledby="financial-reports-heading" className="space-y-12">
      <h2 id="financial-reports-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <PieChart className="mr-3 h-8 w-8 text-primary" />
        Relatórios Financeiros
      </h2>
      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
              <CardTitle className="text-2xl text-center font-bold text-primary">Resumo do Ciclo Atual</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                  Visão geral das finanças baseada nos bilhetes ativos.
              </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                  <Users className="h-10 w-10 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Vendas (Clientes)</p>
                  <p className="text-3xl font-bold text-blue-500">
                      R$ {financialReport.clientRevenue.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">{financialReport.clientTicketCount} bilhetes</p>
              </div>
                <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                  <Users className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Vendas (Vendedores)</p>
                  <p className="text-3xl font-bold text-orange-500">
                      R$ {financialReport.sellerRevenue.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">{financialReport.sellerTicketCount} bilhetes</p>
              </div>
              <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                  <DollarSign className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Total Arrecadado</p>
                  <p className="text-3xl font-bold text-green-500">
                      R$ {financialReport.totalRevenue.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">{financialReport.clientTicketCount + financialReport.sellerTicketCount} bilhetes</p>
              </div>
              <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                  <Percent className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Comissão (Vendedores)</p>
                  <p className="text-3xl font-bold text-orange-500">
                      R$ {financialReport.sellerCommission.toFixed(2).replace('.', ',')}
                  </p>
              </div>
              <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                  <Percent className="h-10 w-10 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Comissão (Bolão)</p>
                  <p className="text-3xl font-bold text-primary">
                      R$ {financialReport.ownerCommission.toFixed(2).replace('.', ',')}
                  </p>
              </div>
              <div className="p-4 rounded-lg bg-background/70 shadow-inner lg:col-span-1">
                  <Trophy className="h-10 w-10 text-accent mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Prêmio Estimado</p>
                  <p className="text-3xl font-bold text-accent">
                      R$ {financialReport.prizePool.toFixed(2).replace('.', ',')}
                  </p>
              </div>
          </CardContent>
          <CardFooter className="pt-6">
              <p className="text-xs text-muted-foreground text-center w-full">
                  Cálculos baseados em todos os bilhetes com status 'ativo'. O prêmio é o total arrecadado menos todas as comissões.
              </p>
          </CardFooter>
      </Card>
      
      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-primary flex items-center justify-center">
            <Download className="mr-3 h-6 w-6" />
            Exportar Dados
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Baixe uma lista de todos os bilhetes ativos e premiados do ciclo atual em formato Excel (.xlsx).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleDownloadExcel} size="lg">
            <Download className="mr-2 h-5 w-5" />
            Baixar Bilhetes (Excel)
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
              <CardTitle className="text-2xl text-center font-bold text-primary flex items-center justify-center">
              <BookText className="mr-3 h-6 w-6" />
              Histórico de Ciclos Anteriores (Admin)
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
              Resumo financeiro de cada ciclo de loteria encerrado.
              </CardDescription>
          </CardHeader>
          <CardContent>
              {adminHistory.length > 0 ? (
              <FinancialChart data={adminHistory} />
              ) : (
              <p className="text-center text-muted-foreground py-10">Nenhum histórico de ciclo anterior encontrado para exibir o gráfico.</p>
              )}
          </CardContent>
      </Card>
    </section>
  );
};
