

"use client";

import { useState, type FC, useEffect, useCallback, useMemo } from 'react';
import type { Ticket, LotteryConfig, User, Draw, SellerHistoryEntry } from '@/types';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import { TicketList } from '@/components/ticket-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, FileText, Loader2, BarChart3, Percent, DollarSign, Ticket as TicketIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { SellerHistoryCard } from './seller-history-card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface SellerDashboardProps {
    isLotteryPaused?: boolean;
    lotteryConfig: LotteryConfig;
    onTicketCreated: (ticket: Ticket) => void;
    userTickets: Ticket[];
    currentUser: User | null;
    allDraws: Draw[];
}

const REPORTS_PER_PAGE = 9;

export const SellerDashboard: FC<SellerDashboardProps> = ({ 
    isLotteryPaused,
    lotteryConfig,
    onTicketCreated,
    userTickets,
    currentUser,
    allDraws,
}) => {
    const { toast } = useToast();
    const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const fetchHistory = useCallback(async (loadMore = false) => {
        if (!currentUser || currentUser.role !== 'vendedor') {
            setIsLoadingHistory(false);
            return;
        }

        if (loadMore) {
            setIsFetchingMore(true);
        } else {
            setIsLoadingHistory(true);
        }
        
        try {
            const historyQueryConstraints = [
                where("sellerId", "==", currentUser.id),
                orderBy("endDate", "desc"),
                limit(REPORTS_PER_PAGE)
            ];

            if (loadMore && lastVisible) {
                historyQueryConstraints.push(startAfter(lastVisible));
            }
            
            const q = query(collection(db, 'sellerHistory'), ...historyQueryConstraints);
            const documentSnapshots = await getDocs(q);

            const newHistoryData = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as SellerHistoryEntry));
            
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);
            setHasMore(newHistoryData.length === REPORTS_PER_PAGE);

            if (loadMore) {
                setSellerHistory(prev => [...prev, ...newHistoryData]);
            } else {
                setSellerHistory(newHistoryData);
            }

        } catch (error) {
            console.error("Error fetching seller history: ", error);
            toast({ title: "Erro ao Carregar Histórico", description: "Não foi possível buscar seu histórico de vendas.", variant: "destructive" });
        } finally {
            setIsLoadingHistory(false);
            setIsFetchingMore(false);
        }
    }, [currentUser, toast, lastVisible]);

    useEffect(() => {
        if (currentUser) {
            fetchHistory(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const currentCycleSummary = useMemo(() => {
        const activeTickets = userTickets.filter(t => t.status === 'active' || t.status === 'winning');
        const ticketCount = activeTickets.length;
        const totalRevenue = ticketCount * lotteryConfig.ticketPrice;
        const estimatedCommission = totalRevenue * (lotteryConfig.sellerCommissionPercentage / 100);

        return { ticketCount, totalRevenue, estimatedCommission };
    }, [userTickets, lotteryConfig]);
    
    // Correctly filter tickets for the current cycle to be displayed in the list
    const currentCycleTickets = useMemo(() => {
        return userTickets.filter(t => t.status === 'active' || t.status === 'winning');
    }, [userTickets]);

    return (
        <Tabs defaultValue="vendas" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md">
                <TabsTrigger value="vendas" className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <ShoppingBag className="mr-2 h-5 w-5" /> Vendas
                </TabsTrigger>
                 <TabsTrigger value="bilhetes" className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <TicketIcon className="mr-2 h-5 w-5" /> Bilhetes
                </TabsTrigger>
                <TabsTrigger value="relatorios" className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                    <FileText className="mr-2 h-5 w-5" /> Relatórios
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vendas">
                <SellerTicketCreationForm
                    isLotteryPaused={isLotteryPaused}
                    onTicketCreated={onTicketCreated}
                    lotteryConfig={lotteryConfig}
                />
            </TabsContent>

             <TabsContent value="bilhetes">
                 <section>
                    <h2 className="text-2xl font-bold text-center text-white mb-6">
                        Meus Bilhetes Vendidos (Ciclo Atual)
                    </h2>
                    <TicketList tickets={currentCycleTickets} draws={allDraws} />
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
                                {hasMore && (
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            onClick={() => fetchHistory(true)}
                                            disabled={isFetchingMore}
                                        >
                                            {isFetchingMore ? (
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
                            <div className="text-center text-muted-foreground bg-card/80 p-10 rounded-lg shadow-inner max-w-2xl mx-auto">
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
    );
};

    