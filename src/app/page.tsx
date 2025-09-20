
"use client";

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, ShoppingCart, ShieldCheck, LogIn, UserPlus, LogOut, History, Award, Eye, EyeOff, LayoutDashboard, Rocket, CheckCircle, Trophy } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw } from '@/types';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

// Sub-componente para o formulário de login do admin
const AdminLoginForm: FC = () => {
    const { login } = useAuth();
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAdminLoginLoading, setIsAdminLoginLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdminLoginLoading(true);
        await login(adminUsername, adminPassword, 'admin');
        setIsAdminLoginLoading(false);
        setAdminUsername('');
        setAdminPassword('');
    };

    return (
        <form onSubmit={handleAdminLogin}>
            <div className="grid gap-4">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Acesso Restrito</h4>
                    <p className="text-sm text-muted-foreground">
                        Insira as credenciais de administrador.
                    </p>
                </div>
                <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="admin-username">Usuário</Label>
                        <Input
                            id="admin-username"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            className="col-span-2 h-8"
                            required
                            disabled={isAdminLoginLoading}
                        />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="admin-password">Senha</Label>
                        <div className="col-span-2 h-8 relative">
                            <Input
                                id="admin-password"
                                type={showPassword ? 'text' : 'password'}
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className="h-8 pr-10"
                                required
                                disabled={isAdminLoginLoading}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isAdminLoginLoading}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </Button>
                        </div>
                    </div>
                </div>
                <Button type="submit" variant="destructive" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isAdminLoginLoading}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> {isAdminLoginLoading ? "Verificando..." : "Entrar"}
                </Button>
            </div>
        </form>
    );
};

// Sub-componente para o cabeçalho da página
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
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 cursor-pointer">
                            <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
                            <span className="font-bold hidden sm:inline-block">Bolão Potiguar</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <AdminLoginForm />
                    </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2 sm:gap-4">
                    {currentUser ? (
                        <div className="flex items-center gap-2">
                            <Button onClick={handlePainelClick} size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                                <LayoutDashboard className="mr-2 h-4 w-4" /> Meu Painel
                            </Button>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={logout} className="shadow-none h-9 w-9">
                                            <LogOut className="h-4 w-4" />
                                            <span className="sr-only">Sair</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Sair ({currentUser.username})</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                                <Link href="/login">
                                    <LogIn className="mr-2 h-4 w-4" />
                                    <span>Entrar</span>
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="text-xs sm:text-sm px-3 sm:px-4">
                                <Link href="/cadastrar">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    <span>Cadastrar</span>
                                </Link>
                            </Button>
                        </div>
                    )}
                    <ThemeToggleButton />
                </div>
            </div>
        </header>
    );
};

// Sub-componente para a seção Hero
const HeroSection: FC = () => {
    const { currentUser } = useAuth();
    return (
        <section className="w-full text-center py-20 md:py-28 lg:py-32 xl:py-40">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center space-y-6">
                    <Image
                        src="/logo.png"
                        alt="Logo Bolão Potiguar"
                        width={150}
                        height={150}
                        priority
                        className="mx-auto"
                    />
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            Bolão Potiguar
                        </h1>
                        <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                            Sua sorte começa aqui! Escolha seus números, faça sua aposta e concorra a prêmios.
                        </p>
                    </div>
                    {!currentUser && (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg">
                                <Link href="/cadastrar?role=cliente">
                                    <UserPlus className="mr-2 h-5 w-5" /> Criar Conta de Cliente
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="secondary">
                                <Link href="/cadastrar?role=vendedor">
                                    <ShoppingCart className="mr-2 h-5 w-5" /> Virar um Vendedor
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

// Sub-componente para a seção de resultados
const ResultsSection: FC<{ lastDraw: Draw | null; isLoading: boolean }> = ({ lastDraw, isLoading }) => {
    if (isLoading) {
        return (
            <div className="w-full text-center py-20 container px-4 md:px-6">
                <p className="text-muted-foreground animate-pulse text-lg">Carregando informações do sorteio...</p>
            </div>
        );
    }

    if (!lastDraw) {
        return (
            <section id="results" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
              <div className="container px-4 md:px-6 text-center">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">Aguardando Próximo Sorteio</h2>
                <p className="max-w-[900px] mx-auto text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                  Nenhum sorteio ativo no momento. Volte em breve para conferir os resultados!
                </p>
              </div>
            </section>
        );
    }

    return (
        <section id="results" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
            <div className="container px-4 md:px-6 space-y-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">Confira o Último Resultado</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Veja os números que saíram no último sorteio e os bichos mais sorteados do ciclo.
                        </p>
                    </div>
                </div>
                <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-1 md:gap-12 lg:max-w-5xl lg:grid-cols-2">
                    <AdminDrawCard draw={lastDraw} />
                    <TopTickets draws={[lastDraw]} />
                </div>
            </div>
        </section>
    );
};

// Sub-componente para a seção "Como Funciona"
const HowItWorksSection: FC = () => (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Como Funciona?</h2>
                    <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Participar é simples, rápido e divertido. Siga os passos abaixo.
                    </p>
                </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
                <Card>
                    <CardHeader className="items-center">
                        <UserPlus className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>1. Crie sua Conta</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p>Cadastre-se gratuitamente como cliente ou vendedor para começar.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="items-center">
                        <CheckCircle className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>2. Faça sua Aposta</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p>Adicione saldo e escolha seus 10 números da sorte no painel de apostas.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="items-center">
                        <Trophy className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>3. Confira os Prêmios</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p>Acompanhe os resultados dos sorteios e veja se você foi um dos ganhadores.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </section>
);

// Sub-componente para o rodapé
const LandingFooter: FC = () => (
    <footer className="w-full">
        <div className="container text-center py-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.
                </p>
                <p className="text-xs text-muted-foreground/70">
                    Jogue com responsabilidade. Para maiores de 18 anos.
                </p>
            </div>
        </div>
    </footer>
);

// Componente principal da página, agora mais limpo e organizado
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
        <div className="flex flex-col flex-1">
            <LandingHeader />
            <main className="flex-1">
                <HeroSection />
                <ResultsSection lastDraw={lastDraw} isLoading={isLoadingDraw} />
                <HowItWorksSection />
            </main>
            <LandingFooter />
        </div>
    );
}
