
"use client";

import { useState, useEffect, type FC } from 'react';
import type { Ticket, LotteryConfig, SellerHistoryEntry, User } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import { TicketList } from '@/components/ticket-list';
import { SellerHistoryCard } from '@/components/seller-history-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Ticket as TicketIcon, FileText, ShoppingBag } from 'lucide-react';


interface SellerDashboardProps {
    isLotteryPaused?: boolean;
    lotteryConfig: LotteryConfig;
    onTicketCreated: (ticket: Ticket) => void;
    userTickets: Ticket[];
    currentUser: User | null;
}

export const SellerDashboard: FC<SellerDashboardProps> = ({ 
    isLotteryPaused,
    lotteryConfig,
    onTicketCreated,
    userTickets,
    currentUser
}) => {
    const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (!currentUser) return;

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
        <Tabs defaultValue="vender" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 rounded-xl shadow-md">
                <TabsTrigger value="vender" className="text-base h-full rounded-lg">
                    <ShoppingBag className="mr-2 h-5 w-5"/>
                    Vender Bilhetes
                </TabsTrigger>
                <TabsTrigger value="relatorios" className="text-base h-full rounded-lg">
                   <FileText className="mr-2 h-5 w-5" />
                   Meus Relatórios
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vender" className="mt-8">
                <div className="space-y-12">
                    <SellerTicketCreationForm
                        isLotteryPaused={isLotteryPaused}
                        onTicketCreated={onTicketCreated}
                        lotteryConfig={lotteryConfig}
                    />
                    <section>
                        <h2 className="text-2xl font-bold text-center text-primary mb-6 flex items-center justify-center">
                           <TicketIcon className="mr-3 h-6 w-6" />
                           Meus Bilhetes Vendidos (Ciclo Atual)
                        </h2>
                        <TicketList tickets={userTickets} />
                    </section>
                </div>
            </TabsContent>

            <TabsContent value="relatorios" className="mt-8">
                <h2 className="text-2xl font-bold text-center text-primary mb-6">Histórico de Vendas por Ciclo</h2>
                {isLoadingHistory ? (
                    <p className="text-center text-muted-foreground">Carregando histórico...</p>
                ) : sellerHistory.length > 0 ? (
                    <ScrollArea className="h-[70vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
                            {sellerHistory.map(entry => (
                                <SellerHistoryCard key={entry.id} historyEntry={entry} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <p className="text-center text-muted-foreground bg-card/80 p-10 rounded-lg shadow-inner">
                        Nenhum histórico de ciclos anteriores encontrado.
                        <br/>
                        Seu primeiro relatório aparecerá aqui após o administrador encerrar o ciclo atual da loteria.
                    </p>
                )}
            </TabsContent>
        </Tabs>
    );
};
