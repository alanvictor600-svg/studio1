
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Users, ShoppingCart, ShieldCheck, ArrowRight, Settings, LogIn, UserPlus, LogOut, History, Award, Eye, EyeOff, LayoutDashboard } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw, Ticket } from '@/types';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout, login } = useAuth();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLoginLoading, setIsAdminLoginLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    
    // Sorteios são públicos, qualquer um pode carregar
    const drawsQuery = query(collection(db, 'draws'));
    const unsubscribeDraws = onSnapshot(drawsQuery, (querySnapshot) => {
        const drawsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));
        setDraws(drawsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
        console.error("Error fetching draws: ", error);
        toast({ title: "Erro ao Carregar Sorteios", description: "Não foi possível carregar os dados dos sorteios.", variant: "destructive" });
    });

    // Bilhetes são privados, carregue apenas se o usuário estiver logado
    let unsubscribeTickets = () => {};
    if (currentUser) {
        const ticketsQuery = query(collection(db, 'tickets'));
        unsubscribeTickets = onSnapshot(ticketsQuery, (querySnapshot) => {
            const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setAllTickets(ticketsData);
        }, (error) => {
            console.error("Error fetching tickets: ", error);
            // Não mostre toast de erro aqui, pode ser apenas falta de permissão momentânea
        });
    } else {
        // Limpa os bilhetes se o usuário deslogar
        setAllTickets([]);
    }

    return () => {
        unsubscribeDraws();
        unsubscribeTickets();
    };
  }, [toast, currentUser]);

  const handlePainelClick = () => {
    if (!currentUser) {
        router.push('/login');
        return;
    }
    switch (currentUser.role) {
        case 'admin':
            router.push('/admin');
            break;
        case 'cliente':
            router.push('/cliente');
            break;
        case 'vendedor':
            router.push('/vendedor');
            break;
        default:
            router.push('/login');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAdminLoginLoading(true);
      await login(adminUsername, adminPassword, 'admin');
      setIsAdminLoginLoading(false);
      setIsPopoverOpen(false);
      setAdminUsername('');
      setAdminPassword('');
  };


  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Bolão Potiguar...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
       <div className="fixed top-6 left-6 z-50">
          {currentUser ? (
              <Button onClick={handlePainelClick} className="shadow-lg">
                  <LayoutDashboard className="mr-2 h-5 w-5" /> Ir para o meu Painel
              </Button>
          ) : (
              <Button onClick={() => router.push('/login')} className="shadow-lg">
                  <LogIn className="mr-2 h-5 w-5" /> Entrar ou Cadastrar
              </Button>
          )}
       </div>

      <div className="fixed top-6 right-6 z-50 flex space-x-2">
        {currentUser && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={logout} className="shadow-md">
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sair</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sair ({currentUser.username})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ThemeToggleButton />
      </div>
      <header className="mb-12 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png" 
            alt="Logo Bolão Potiguar" 
            width={150} 
            height={150} 
            priority 
            className="mx-auto"
          />
        </div>
        <p className="text-lg text-muted-foreground mt-2">Sua sorte começa aqui!</p> 
      </header>

      <main className="w-full max-w-5xl space-y-12 flex-grow">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-primary text-center flex items-center justify-center">
                <History className="mr-3 h-6 w-6" /> Último Sorteio
             </h2>
             {draws.length > 0 ? (
                <AdminDrawCard draw={draws[0]} />
             ) : (
                <div className="text-center py-10 bg-card/80 backdrop-blur-sm rounded-lg shadow-inner h-full flex flex-col justify-center items-center">
                    <p className="text-muted-foreground">Nenhum sorteio realizado ainda.</p>
                </div>
             )}
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary text-center flex items-center justify-center">
                <Award className="mr-3 h-6 w-6" /> Acertos
            </h2>
            <TopTickets tickets={allTickets} draws={draws} />
          </div>
        </div>

        <div className="text-center py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/login?redirect=/cliente" passHref>
              <Card className="text-left hover:bg-muted/50 transition-colors shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-primary">
                    <Users className="mr-3 h-6 w-6" />
                    Acessar como Cliente
                  </CardTitle>
                  <CardDescription>
                    Compre bilhetes, confira seus jogos e veja os resultados.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="link" className="p-0 h-auto">
                    Entrar na sua conta de cliente <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
            <Link href="/login?redirect=/vendedor" passHref>
              <Card className="text-left hover:bg-muted/50 transition-colors shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-secondary-foreground">
                    <ShoppingCart className="mr-3 h-6 w-6 text-secondary" />
                    Acessar como Vendedor
                  </CardTitle>
                  <CardDescription>
                    Venda bilhetes, gerencie suas vendas e acompanhe suas comissões.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                   <Button variant="link" className="p-0 h-auto">
                    Entrar no painel de vendas <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          </div>
        </div>
        
      </main>

      <div className="fixed bottom-6 left-6 z-50">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 bg-card/80 backdrop-blur-sm shadow-lg border-border/50">
                          <Settings className="h-6 w-6 text-muted-foreground" />
                          <span className="sr-only">Configurações de Administrador</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p>Acesso do Administrador</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </PopoverTrigger>
          <PopoverContent className="w-80">
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
          </PopoverContent>
        </Popover>
      </div>

      <footer className="mt-20 py-8 text-center border-t border-border/50 w-full">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar. Todos os direitos reservados.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Jogue com responsabilidade. Para maiores de 18 anos.
        </p>
      </footer>
    </div>
  );
}
