
"use client";

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, UserPlus, LogOut, LayoutDashboard, ShieldCheck, ArrowRight, CheckCircle, Gift, BarChart2, TrendingUp } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw } from '@/types';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { cn } from '@/lib/utils';

// --- SUB-COMPONENTS FOR THE NEW LAYOUT ---

const AdminLoginForm: FC = () => {
    const { login } = useAuth();
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isAdminLoginLoading, setIsAdminLoginLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdminLoginLoading(true);
        await login(adminUsername, adminPassword, 'admin');
        setIsAdminLoginLoading(false);
    };

    return (
        <form onSubmit={handleAdminLogin} className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Acesso Restrito</h4>
                <p className="text-sm text-muted-foreground">
                    Insira as credenciais de administrador.
                </p>
            </div>
            <div className="grid gap-2">
                <Input
                    id="admin-username"
                    placeholder="Usuário Admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    disabled={isAdminLoginLoading}
                />
                <Input
                    id="admin-password"
                    type="password"
                    placeholder="Senha"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={isAdminLoginLoading}
                />
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={isAdminLoginLoading}>
                <ShieldCheck className="mr-2 h-4 w-4" /> {isAdminLoginLoading ? "Verificando..." : "Entrar"}
            </Button>
        </form>
    );
};

const LandingHeader: FC = () => {
    const { currentUser, logout } = useAuth();
    const router = useRouter();

    const handlePainelClick = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        const targetPath = currentUser.role === 'admin' ? '/admin' : `/dashboard/${currentUser.role}`;
        router.push(targetPath);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2 font-bold">
                    <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
                    <span>Bolão Potiguar</span>
                </Link>

                <nav className="flex items-center gap-2">
                    {currentUser ? (
                        <>
                            <Button onClick={handlePainelClick} size="sm">
                                <LayoutDashboard className="mr-2 h-4 w-4" /> Meu Painel
                            </Button>
                            <Button variant="ghost" size="sm" onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" /> Sair
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild size="sm" variant="ghost">
                                <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Entrar</Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/cadastrar"><UserPlus className="mr-2 h-4 w-4" />Cadastrar</Link>
                            </Button>
                        </>
                    )}
                    <ThemeToggleButton />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <AdminLoginForm />
                        </PopoverContent>
                    </Popover>
                </nav>
            </div>
        </header>
    );
};

const NewHeroSection: FC = () => {
    return (
        <section className="w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 text-center">
                <div className="flex flex-col items-center space-y-6">
                     <Image
                        src="/logo.png"
                        alt="Logo Bolão Potiguar"
                        width={120}
                        height={120}
                        priority
                        className="mx-auto drop-shadow-2xl"
                    />
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                        A Sorte Bate à sua Porta
                    </h1>
                    <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl">
                        Participe do Bolão Potiguar. Escolha seus números, faça sua aposta e concorra a prêmios incríveis de um jeito simples e divertido.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button asChild size="lg">
                            <Link href="/cadastrar?role=cliente">
                                Começar a Apostar <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/cadastrar?role=vendedor">
                                Torne-se um Vendedor
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeaturesSection: FC = () => {
    const features = [
        { icon: CheckCircle, title: 'Simples de Jogar', description: 'Escolha seus números em uma interface intuitiva e fácil de usar.' },
        { icon: Gift, title: 'Prêmios Atrativos', description: 'Concorra a prêmios que podem mudar o seu dia.' },
        { icon: BarChart2, title: 'Resultados Rápidos', description: 'Acompanhe os sorteios e confira os resultados em tempo real.' }
    ];

    return (
        <section className="w-full py-12 md:py-24 bg-muted">
            <div className="container px-4 md:px-6">
                <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-3 lg:gap-12">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <feature.icon className="h-12 w-12 text-primary mb-4" />
                            <h3 className="text-xl font-bold">{feature.title}</h3>
                            <p className="text-muted-foreground mt-2">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const NewResultsSection: FC<{ lastDraw: Draw | null; isLoading: boolean }> = ({ lastDraw, isLoading }) => (
    <section id="results" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary flex items-center justify-center gap-3">
                    <TrendingUp className="h-8 w-8" />
                    Último Sorteio
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                    Confira os números sorteados e os bichos mais populares do ciclo atual.
                </p>
            </div>
             {isLoading ? (
                 <div className="text-center py-10 text-muted-foreground">Carregando resultados...</div>
             ) : lastDraw ? (
                <div className="mx-auto grid items-start gap-8 sm:max-w-4xl md:gap-12 lg:max-w-5xl lg:grid-cols-2 pt-12">
                    <AdminDrawCard draw={lastDraw} />
                    <TopTickets draws={[lastDraw]} />
                </div>
             ) : (
                <div className="text-center py-16 bg-background/50 rounded-lg shadow-inner mt-8 max-w-2xl mx-auto">
                    <p className="font-semibold text-lg text-foreground">Nenhum sorteio ativo no momento.</p>
                    <p className="text-sm text-muted-foreground mt-2">Aguardando o administrador registrar o primeiro sorteio do ciclo.</p>
                </div>
             )}
        </div>
    </section>
);


const NewFooter: FC = () => (
    <footer className="w-full border-t bg-background">
        <div className="container px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.</p>
            <nav className="flex gap-4">
                <Link href="#" className="hover:text-primary">Termos de Serviço</Link>
                <Link href="#" className="hover:text-primary">Política de Privacidade</Link>
            </nav>
        </div>
    </footer>
);


// --- MAIN PAGE COMPONENT ---

export default function LandingPage() {
    const [lastDraw, setLastDraw] = useState<Draw | null>(null);
    const [isLoadingDraw, setIsLoadingDraw] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const drawsQuery = query(collection(db, 'draws'), orderBy('createdAt', 'desc'), limit(1));
        const unsubscribeDraws = onSnapshot(drawsQuery, (querySnapshot) => {
            if (!querySnapshot.empty) {
                setLastDraw({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Draw);
            } else {
                setLastDraw(null);
            }
            setIsLoadingDraw(false);
        }, (error) => {
            console.error("Error fetching last draw: ", error.message);
            toast({ title: "Erro de Conexão", description: "Não foi possível carregar os dados do sorteio.", variant: "destructive" });
            setLastDraw(null);
            setIsLoadingDraw(false);
        });

        return () => unsubscribeDraws();
    }, [toast]);

    return (
        <div className="flex flex-col min-h-screen">
            <LandingHeader />
            <main className="flex-1">
                <NewHeroSection />
                <FeaturesSection />
                <NewResultsSection lastDraw={lastDraw} isLoading={isLoadingDraw} />
            </main>
            <NewFooter />
        </div>
    );
}
