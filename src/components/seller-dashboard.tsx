
"use client";

import { useState, type FC, useEffect } from 'react';
import type { Ticket, LotteryConfig, User, Draw, SellerHistoryEntry } from '@/types';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import { TicketList } from '@/components/ticket-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, FileText } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SellerHistoryCard } from './seller-history-card';
import { ScrollArea } from './ui/scroll-area';

interface SellerDashboardProps {
    isLotteryPaused?: boolean;
    lotteryConfig: LotteryConfig;
    onTicketCreated: (ticket: Ticket) => void;
    userTickets: Ticket[];
    currentUser: User | null;
    allDraws: Draw[];
}

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

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'vendedor') {
             setIsLoadingHistory(false);
             return;
        };

        setIsLoadingHistory(true);
        const historyQuery = query(
            collection(db, 'sellerHistory'), 
            where("sellerId", "==", currentUser.id),
            orderBy("endDate", "desc")
        );

        const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
            const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SellerHistoryEntry));
            setSellerHistory(historyData);
            setIsLoadingHistory(false);
        }, (error) => {
            console.error("Error fetching seller history: ", error);
            toast({ title: "Erro ao Carregar Histórico", description: "Não foi possível buscar seu histórico de vendas.", variant: "destructive" });
            setIsLoadingHistory(false);
        });

        return () => unsubscribe();
    }, [currentUser, toast]);

    return (
        <Tabs defaultValue="vendas" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto mb-8">
                <TabsTrigger value="vendas" className="py-3 text-base">
                    <ShoppingBag className="mr-2 h-5 w-5" /> Vendas
                </TabsTrigger>
                <TabsTrigger value="relatorios" className="py-3 text-base">
                    <FileText className="mr-2 h-5 w-5" /> Relatórios
                </TabsTrigger>
            </TabsList>
            <TabsContent value="vendas">
                <div className="space-y-12">
                    <SellerTicketCreationForm
                        isLotteryPaused={isLotteryPaused}
                        onTicketCreated={onTicketCreated}
                        lotteryConfig={lotteryConfig}
                    />
                    <section>
                        <h2 className="text-2xl font-bold text-center text-primary mb-6">
                            Meus Bilhetes Vendidos (Ciclo Atual)
                        </h2>
                        <TicketList tickets={userTickets} draws={allDraws} />
                    </section>
                </div>
            </TabsContent>
            <TabsContent value="relatorios">
                 <section>
                    <h2 className="text-3xl font-bold text-center text-primary mb-8 flex items-center justify-center">
                        Meus Relatórios de Vendas
                    </h2>
                    <p className="text-center text-muted-foreground -mt-6 mb-8">
                        Acompanhe seu desempenho e comissões de ciclos de loteria anteriores.
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
                        </ScrollArea>
                    ) : (
                        <div className="text-center text-muted-foreground bg-card/80 p-10 rounded-lg shadow-inner max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold text-foreground">Nenhum Relatório Encontrado</h3>
                            <p className="mt-2">
                                Seu primeiro relatório de ciclo aparecerá aqui após o administrador encerrar a loteria atual.
                            </p>
                        </div>
                    )}
                </section>
            </TabsContent>
        </Tabs>
    );
};
