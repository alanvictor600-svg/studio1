
"use client";

import { useState, type FC, useMemo } from 'react';
import type { Ticket, Draw } from '@/types';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import { TicketList } from '@/components/ticket-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, FileText, Loader2, BarChart3, Percent, DollarSign, Ticket as TicketIcon } from 'lucide-react';
import { SellerHistoryCard } from './seller-history-card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useDashboard } from '@/context/dashboard-context';
import { TicketReceiptDialog } from './ticket-receipt-dialog';


interface SellerDashboardProps {
    isLotteryPaused?: boolean;
    userTickets: Ticket[];
    allDraws: Draw[];
}

export const SellerDashboard: FC<SellerDashboardProps> = ({ 
    isLotteryPaused,
    userTickets,
    allDraws,
}) => {
    const [activeTab, setActiveTab] = useState('vendas');
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);

    const { 
        lotteryConfig, 
        sellerHistory,
        isLoadingHistory,
        loadMoreHistory,
        hasMoreHistory
    } = useDashboard();

    const handleGenerateReceipt = (ticket: Ticket) => {
        setReceiptTickets([ticket]);
    };

    const currentCycleSummary = useMemo(() => {
        if (!lotteryConfig) {
            return { ticketCount: 0, totalRevenue: 0, estimatedCommission: 0 };
        }
        const activeTickets = userTickets.filter(t => t.status === 'active' || t.status === 'winning');
        const ticketCount = activeTickets.length;
        const totalRevenue = ticketCount * lotteryConfig.ticketPrice;
        const estimatedCommission = totalRevenue * (lotteryConfig.sellerCommissionPercentage / 100);

        return { ticketCount, totalRevenue, estimatedCommission };
    }, [userTickets, lotteryConfig]);
    
    const TABS_CONFIG = [
        { value: 'vendas', label: 'Registrar Venda', Icon: ShoppingBag },
        { value: 'bilhetes', label: 'Bilhetes Vendidos', Icon: TicketIcon },
        { value: 'relatorios', label: 'Meus Relatórios', Icon: FileText },
    ];

    return (
        <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md">
                    {TABS_CONFIG.map(tab => (
                        <TabsTrigger 
                            key={tab.value} 
                            value={tab.value} 
                            className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                        >
                            <tab.Icon className="mr-2 h-5 w-5" /> {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="vendas">
                    <SellerTicketCreationForm
                        isLotteryPaused={isLotteryPaused}
                    />
                </TabsContent>
                
                <TabsContent value="bilhetes">
                     <section>
                        <h2 className="text-2xl font-bold text-center text-white mb-6">
                            Bilhetes Vendidos no Ciclo Atual
                        </h2>
                        <TicketList 
                          tickets={userTickets} 
                          draws={allDraws}
                          onGenerateReceipt={handleGenerateReceipt}
                        />
                    </section>
                </TabsContent>

                <TabsContent value="relatorios">
                     <section className="space-y-12">
                        <Card className="shadow-lg bg-card/90 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-xl text-primary flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Resumo do Ciclo Atual
                                </CardTitle>
                                 <CardDescription>
                                   Seu desempenho de vendas em tempo real.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="p-4 rounded-lg bg-background/70 shadow-inner">
                                    <p className="text-sm font-medium text-muted-foreground">Bilhetes Vendidos</p>
                                    <p className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                                        <TicketIcon className="h-7 w-7 text-blue-500" />
                                        {currentCycleSummary.ticketCount}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-background/70 shadow-inner">
                                    <p className="text-sm font-medium text-muted-foreground">Receita Gerada</p>
                                    <p className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                                         <DollarSign className="h-7 w-7 text-green-500" />
                                        {currentCycleSummary.totalRevenue.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                                 <div className="p-4 rounded-lg bg-background/70 shadow-inner">
                                    <p className="text-sm font-medium text-muted-foreground">Comissão Estimada</p>
                                    <p className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                                         <Percent className="h-7 w-7 text-yellow-500" />
                                        {currentCycleSummary.estimatedCommission.toFixed(2).replace('.', ',')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div>
                            <h2 className="text-3xl font-bold text-center text-white mb-8 flex items-center justify-center">
                                Histórico de Ciclos Anteriores
                            </h2>
                            <p className="text-center text-white/80 -mt-6 mb-8">
                                Acompanhe seu desempenho e comissões de ciclos de loteria encerrados.
                            </p>
                            {isLoadingHistory ? (
                                <p className="text-center text-muted-foreground py-10">Carregando histórico...</p>
                            ) : sellerHistory.length > 0 ? (
                                <ScrollArea className="h-[70vh]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                                        {sellerHistory.map(entry => (
                                            <SellerHistoryCard key={entry.id} historyEntry={entry} />
                                        ))}
                                    </div>
                                    {hasMoreHistory && (
                                        <div className="flex justify-center mt-6">
                                            <Button
                                                onClick={loadMoreHistory}
                                                disabled={isLoadingHistory}
                                            >
                                                {isLoadingHistory ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Carregando...
                                                    </>
                                                ) : (
                                                    'Carregar Mais Relatórios'
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </ScrollArea>
                            ) : (
                                <div className="text-center text-muted-foreground bg-card/80 p-10 rounded-lg shadow-inner">
                                    <h3 className="text-lg font-semibold text-foreground">Nenhum Relatório Encontrado</h3>
                                    <p className="mt-2">
                                        Seu primeiro relatório de ciclo aparecerá aqui após o administrador encerrar a loteria atual.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </TabsContent>
            </Tabs>

            <TicketReceiptDialog
                isOpen={!!receiptTickets}
                onOpenChange={(isOpen) => { if (!isOpen) setReceiptTickets(null); }}
                tickets={receiptTickets}
                lotteryConfig={lotteryConfig}
            />
        </>
    );
};
