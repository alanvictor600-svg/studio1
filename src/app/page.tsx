
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { History, Gamepad2, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


const Header = () => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      const defaultRedirect = currentUser.role === 'admin' ? '/admin' : `/dashboard/${currentUser.role}`;
      router.replace(defaultRedirect);
    }
  }, [isLoading, isAuthenticated, currentUser, router]);

  if (isLoading || isAuthenticated) {
    return (
      <header className="container mx-auto px-4 md:px-6 sticky top-0 z-40 w-full border-b bg-secondary">
        <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
                <span className="hidden sm:inline-block">Bolão Potiguar</span>
            </Link>
            <div className="text-sm text-muted-foreground">Verificando sessão...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="container mx-auto px-4 md:px-6 sticky top-0 z-40 w-full border-b bg-secondary">
      <div className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
          <span className="hidden sm:inline-block text-foreground">Bolão Potiguar</span>
        </Link>
        <div className="flex items-center gap-2">
            <Button asChild variant="default" className="shadow-md bg-blue-500 hover:bg-blue-600 text-white">
                <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
            </Button>
            <Button asChild className="shadow-md bg-green-500 hover:bg-green-600 text-white">
                <Link href="/cadastrar"><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</Link>
            </Button>
        </div>
      </div>
    </header>
  );
};

const HeroSection = () => (
  <section className="text-center py-16 md:py-24">
    <div className="max-w-3xl mx-auto">
      <h1 className={cn(
          "text-4xl md:text-6xl font-extrabold tracking-tighter",
          "text-green-500"
      )}>
        A Próxima Grande Sorte Pode Ser a Sua.
      </h1>
      <p className="mt-4 text-lg md:text-xl text-white/80">
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
    const [lastDraw, setLastDraw] = useState<Draw | null>(null);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'draws'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
            setAllDraws(drawsData);
            setLastDraw(drawsData[0] || null);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching draws: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <section className="bg-muted/50 py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mx-auto max-w-5xl space-y-8 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold text-primary flex items-center justify-center gap-3">
                        <History className="h-8 w-8"/>
                        Resultados e Estatísticas
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Confira o resultado do último sorteio e veja os números mais quentes do ciclo.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start mt-12 max-w-6xl mx-auto">
                    <div>
                         {isLoading ? (
                            <Card className="h-full">
                                <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                                    <p className="text-muted-foreground">Carregando resultados...</p>
                                </CardContent>
                            </Card>
                        ) : lastDraw ? (
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
                         <TopTickets draws={allDraws} />
                    </div>
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
