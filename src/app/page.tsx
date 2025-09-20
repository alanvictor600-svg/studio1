
"use client";

import { useState, useEffect, type FC } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, UserPlus, LogOut, LayoutDashboard, ShieldCheck, CheckCircle, Trophy } from 'lucide-react';
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
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold">
                    <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
                    <span>Bolão Potiguar</span>
                </Link>

                <div className="flex items-center gap-2">
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
                </div>
            </div>
        </header>
    );
};

const LandingFooter: FC = () => {
    return (
        <footer className="border-t">
            <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.</p>
                <p className="text-xs">Jogue com responsabilidade. Para maiores de 18 anos.</p>
            </div>
        </footer>
    );
};

export default function LandingPage() {
    const [lastDraw, setLastDraw] = useState<Draw | null>(null);
    const [isLoadingDraw, setIsLoadingDraw] = useState(true);
    const { toast } = useToast();
    const { currentUser } = useAuth();

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
                {/* Hero Section */}
                <section className="w-full py-20 md:py-28 lg:py-32 xl:py-40 text-center">
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
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                                Bolão Potiguar
                            </h1>
                            <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl">
                                Sua sorte começa aqui! Escolha seus números, faça sua aposta e concorra a prêmios.
                            </p>
                            {!currentUser && (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button asChild size="lg">
                                        <Link href="/cadastrar?role=cliente">
                                            <UserPlus className="mr-2 h-5 w-5" /> Criar Conta de Cliente
                                        </Link>
                                    </Button>
                                    <Button asChild size="lg" variant="secondary">
                                        <Link href="/cadastrar?role=vendedor">
                                            Virar um Vendedor
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                <section id="results" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-primary">Confira o Último Resultado</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                                Veja os números que saíram no último sorteio e os bichos mais sorteados do ciclo.
                            </p>
                        </div>
                         {isLoadingDraw ? (
                             <div className="text-center py-10 text-muted-foreground">Carregando...</div>
                         ) : lastDraw ? (
                            <div className="mx-auto grid items-start gap-8 sm:max-w-4xl md:gap-12 lg:max-w-5xl lg:grid-cols-2 pt-12">
                                <AdminDrawCard draw={lastDraw} />
                                <TopTickets draws={[lastDraw]} />
                            </div>
                         ) : (
                            <div className="text-center py-10 text-muted-foreground">Nenhum sorteio cadastrado ainda.</div>
                         )}
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Como Funciona?</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                                Participar é simples, rápido e divertido. Siga os passos abaixo.
                            </p>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="items-center text-center">
                                    <UserPlus className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>1. Crie sua Conta</CardTitle>
                                    <CardDescription>Cadastre-se gratuitamente como cliente ou vendedor.</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card>
                                <CardHeader className="items-center text-center">
                                    <CheckCircle className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>2. Faça sua Aposta</CardTitle>
                                    <CardDescription>Escolha seus números e confirme sua aposta no painel.</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card>
                                <CardHeader className="items-center text-center">
                                    <Trophy className="h-10 w-10 text-primary mb-2" />
                                    <CardTitle>3. Confira os Prêmios</CardTitle>
                                    <CardDescription>Acompanhe os resultados e veja se você ganhou.</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
            <LandingFooter />
        </div>
    );
}
