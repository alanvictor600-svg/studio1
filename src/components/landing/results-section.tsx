"use client";

import { useState, useEffect } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { Lock, History } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { Draw } from '@/types';
import { db } from '@/lib/firebase';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ResultsSection = () => {
    const { isAuthenticated } = useAuth();
    const [lastDraw, setLastDraw] = useState<Draw | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        
        // We only attempt to fetch if isAuthenticated is resolved to true.
        if (isAuthenticated) {
            setIsLoading(true);
            const drawsQuery = query(collection(db, 'draws'), orderBy('createdAt', 'desc'));
            unsubscribe = onSnapshot(drawsQuery, (querySnapshot) => {
                const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
                setLastDraw(drawsData[0] || null);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching draws: ", error);
                setIsLoading(false);
            });
        } else {
             // If not authenticated, don't show loading, just show the login prompt.
             setIsLoading(false);
             setLastDraw(null);
        }

        // Cleanup subscription on unmount or when auth state changes
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isAuthenticated]);

    return (
        <section className="bg-muted/50 py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-5xl space-y-8 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3">
                        <History className="h-8 w-8"/>
                        Último Resultado
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Confira o resultado do último sorteio realizado no ciclo atual.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-8 md:gap-12 items-start mt-12 max-w-2xl mx-auto">
                   {isLoading ? (
                        <Card className="h-full">
                            <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                                <p className="text-muted-foreground">Verificando... Carregando dados...</p>
                            </CardContent>
                        </Card>
                    ) : !isAuthenticated ? (
                        <Card className="h-full flex flex-col items-center justify-center text-center p-8 bg-card/80 backdrop-blur-sm shadow-xl">
                            <Lock className="h-12 w-12 text-primary mb-4" />
                            <h3 className="text-2xl font-bold">Conteúdo Exclusivo para Membros</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                Faça login ou cadastre-se para ver os resultados dos últimos sorteios.
                            </p>
                            <div className="flex gap-4 mt-6">
                                <Button asChild><Link href="/login">Entrar</Link></Button>
                                <Button asChild variant="secondary"><Link href="/cadastrar">Cadastrar</Link></Button>
                            </div>
                        </Card>
                    ) : (
                        <>
                            <div>
                                {lastDraw ? (
                                <AdminDrawCard draw={lastDraw} />
                                ) : (
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="text-xl text-center">Nenhum Sorteio Ativo</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                                        <p className="text-center text-muted-foreground">Ainda não houve sorteios neste ciclo. Volte em breve!</p>
                                    </CardContent>
                                </Card>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};
