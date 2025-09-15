
"use client";

import { useState, useEffect, type FC } from 'react';
import type { SellerHistoryEntry, User } from '@/types';
import { SellerHistoryCard } from '@/components/seller-history-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { FileText } from 'lucide-react';


export default function SellerReportsPage() {
    const { currentUser } = useAuth();
    const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const { toast } = useToast();

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
        <section>
            <h2 className="text-3xl font-bold text-center text-primary mb-8 flex items-center justify-center">
                <FileText className="mr-3 h-7 w-7" />
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
    );
};
