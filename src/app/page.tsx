
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw, Ticket } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { History, Gamepad2, Gift, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { calculateTicketMatches } from '@/lib/lottery-utils';


const Header = () => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();

  const dashboardPath = currentUser?.role === 'admin' 
      ? '/admin' 
      : (currentUser ? `/dashboard/${currentUser.role}` : '/login');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-secondary">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
          <span className="hidden sm:inline-block text-foreground">Bolão Potiguar</span>
        </Link>
        <div className="flex items-center gap-2">
            {isLoading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : isAuthenticated ? (
                <Button asChild>
                    <Link href={dashboardPath}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel</Link>
                </Button>
            ) : (
                <>
                    <Button asChild variant="default" className="shadow-md bg-blue-500 hover:bg-blue-600 text-white">
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
                    </Button>
                    <Button asChild className="shadow-md bg-green-500 hover:bg-green-600 text-white">
                        <Link href="/cadastrar"><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</Link>
                    </Button>
                </>
            )}
        </div>
      </div>
    </header>
  );
};

const HeroSection = () => (
  <section className="text-center py-16 md:py-24 bg-gradient-to-b from-emerald-700 to-emerald-900">
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-transparent bg-clip-text">
        A Próxima Grande Sorte Pode Ser a Sua.
      </h1>
      <p className="mt-4 text-lg md:text-xl text-white">
        Escolha seus números, sinta a emoção e transforme um simples palpite em prêmios incríveis. A aposta é fácil, a diversão é garantida.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button asChild size="lg" className="text-lg shadow-lg">
          <Link href="/cadastrar">Comece a Apostar Agora</Link>
        </Button>
      </div>
    </div>
  </section>
);

const ResultsSection = () => {
    const { isAuthenticated, authLoading } = useAuth();
    const [lastDraw, setLastDraw] = useState<Draw | null>(null);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) {
            setIsLoading(true);
            return;
        }

        if (isAuthenticated) {
            setIsLoading(true);
            
            // Listener for draws
            const drawsQuery = query(collection(db, 'draws'), orderBy('createdAt', 'desc'));
            const unsubscribeDraws = onSnapshot(drawsQuery, (querySnapshot) => {
                const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
                setAllDraws(drawsData);
                setLastDraw(drawsData[0] || null);
            }, (error) => {
                console.error("Error fetching draws: ", error);
            });

            // Listener for active tickets
            const ticketsQuery = query(collection(db, 'tickets'), where('status', '==', 'active'));
            const unsubscribeTickets = onSnapshot(ticketsQuery, (querySnapshot) => {
                const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
                setActiveTickets(ticketsData);
                setIsLoading(false); // Consider loading finished when both are fetched at least once
            }, (error) => {
                console.error("Error fetching active tickets: ", error);
                setIsLoading(false);
            });

            return () => {
                unsubscribeDraws();
                unsubscribeTickets();
            };
        } else {
            setIsLoading(false);
            setAllDraws([]);
            setActiveTickets([]);
            setLastDraw(null);
        }
    }, [isAuthenticated, authLoading]);

    const rankedTickets = useMemo(() => {
        if (!allDraws.length || !activeTickets.length) return [];
        
        return activeTickets
            .map(ticket => ({
                ...ticket,
                matches: calculateTicketMatches(ticket, allDraws),
            }))
            .filter(ticket => ticket.matches > 0)
            .sort((a, b) => b.matches - a.matches)
            .slice(0, 5); // Top 5 tickets
    }, [activeTickets, allDraws]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <Card className="h-full col-span-1 lg:col-span-2">
                    <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                        <p className="text-muted-foreground">Verificando... Carregando dados...</p>
                    </CardContent>
                </Card>
            );
        }
        
        if (!isAuthenticated) {
            return (
                <Card className="h-full col-span-1 lg:col-span-2 flex flex-col items-center justify-center text-center p-8 bg-card/80 backdrop-blur-sm shadow-xl">
                    <Lock className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-2xl font-bold">Conteúdo Exclusivo para Membros</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        Faça login ou cadastre-se para ver os resultados dos últimos sorteios e o ranking de acertos.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <Button asChild><Link href="/login">Entrar</Link></Button>
                        <Button asChild variant="secondary"><Link href="/cadastrar">Cadastrar</Link></Button>
                    </div>
                </Card>
            );
        }

        return (
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
                 <div className="h-full">
                     <TopTickets rankedTickets={rankedTickets} />
                </div>
            </>
        );
    };

    return (
        <section className="bg-muted/50 py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-5xl space-y-8 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3">
                        <History className="h-8 w-8"/>
                        Resultados e Ranking
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Confira o resultado do último sorteio e veja os bilhetes com mais acertos!
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start mt-12 max-w-6xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        </section>
    );
};

const HowItWorksSection = () => (
  <section className="py-16 md:py-24">
    <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-primary">Como Funciona?</h2>
        <p className="mt-3 text-lg text-muted-foreground">É fácil participar. Siga os três passos abaixo:</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
        <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
                <UserPlus size={32} />
                </div>
                <h3 className="text-xl font-bold">1. Cadastre-se</h3>
                <p className="text-muted-foreground mt-2">Crie sua conta de cliente de forma rápida e segura.</p>
            </div>
        </Card>
        <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
                <Gamepad2 size={32} />
                </div>
                <h3 className="text-xl font-bold">2. Faça sua Aposta</h3>
                <p className="text-muted-foreground mt-2">Escolha seus 10 números da sorte, de 1 a 25. Pode repetir!</p>
            </div>
        </Card>
        <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
                <Gift size={32} />
                </div>
                <h3 className="text-xl font-bold">3. Concorra aos Prêmios</h3>
                <p className="text-muted-foreground mt-2">Aguarde o sorteio. Se seus 10 números forem sorteados, você ganha!</p>
            </div>
        </Card>
        </div>
    </div>
  </section>
);


const Footer = () => (
  <footer className="bg-secondary border-t">
    <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} <Link href="/login?as=admin" className="hover:text-primary">Bolão Potiguar</Link>. Todos os direitos reservados.</p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-primary">Termos de Serviço</Link>
            <Link href="#" className="hover:text-primary">Política de Privacidade</Link>
            <ThemeToggleButton />
        </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ResultsSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}

    