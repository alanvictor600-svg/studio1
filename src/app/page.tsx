

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Users, ShoppingCart, ShieldCheck, ArrowRight, Settings, LogIn, UserPlus, LogOut, History, Award, Eye, EyeOff, LayoutDashboard, Rocket, Star } from 'lucide-react';
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
import { db } from '@/lib/firebase';

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout, login } = useAuth();
  const router = useRouter();
  const [lastDraw, setLastDraw] = useState<Draw | null>(null);
  const [isLoadingDraw, setIsLoadingDraw] = useState(true);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLoginLoading, setIsAdminLoginLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    
    // The query for the last draw is now universal, not restricted to admin.
    // Firestore rules should be set to allow public read access to the 'draws' collection.
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

    return () => {
        unsubscribeDraws();
    };
  }, [toast]);

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
            router.push('/dashboard/cliente');
            break;
        case 'vendedor':
            router.push('/dashboard/vendedor');
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
            <Popover>
              <PopoverTrigger asChild>
                <Button className="shadow-lg">
                  <LogIn className="mr-2 h-5 w-5" /> Entrar ou Cadastrar
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none text-primary">Acessar Plataforma</h4>
                    <p className="text-sm text-muted-foreground">
                      Escolha seu tipo de acesso para continuar.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Button asChild variant="outline">
                      <Link href="/login?redirect=/dashboard/cliente">
                        <Users className="mr-2 h-4 w-4" /> Acessar como Cliente
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/login?redirect=/dashboard/vendedor">
                        <ShoppingCart className="mr-2 h-4 w-4" /> Acessar como Vendedor
                      </Link>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
        {isLoadingDraw ? (
          <div className="text-center py-10 bg-card/80 backdrop-blur-sm rounded-lg shadow-inner h-full flex flex-col justify-center items-center">
              <p className="text-muted-foreground animate-pulse text-lg">Carregando informações do sorteio...</p>
          </div>
        ) : lastDraw ? (
          <>
            <h2 className="text-3xl font-bold text-primary text-center">Último Sorteio Realizado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h3 className="text-2xl font-bold text-primary text-center flex items-center justify-center">
                    <History className="mr-3 h-6 w-6" /> Resultados
                 </h3>
                 <AdminDrawCard draw={lastDraw} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-primary text-center flex items-center justify-center">
                    <Award className="mr-3 h-6 w-6" /> Números da Sorte
                </h3>
                <TopTickets draws={lastDraw ? [lastDraw] : []} />
              </div>
            </div>
          </>
        ) : (
          <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/90 backdrop-blur-sm text-center">
            <CardHeader>
              <Rocket className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold">Bem-vindo ao Bolão Potiguar!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-2">
                A sorte está se preparando. Nenhum sorteio ativo no momento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-base">
              <p>Fique de olho! O próximo ciclo de sorteios começará em breve.</p>
              <p>Enquanto isso, você já pode criar sua conta para não perder a chance de apostar assim que a loteria for aberta.</p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <Button asChild size="lg" className="shadow-lg">
                    <Link href="/cadastrar?role=cliente">
                        <UserPlus className="mr-2 h-5 w-5" /> Criar Conta de Cliente
                    </Link>
                </Button>
                 <Button asChild size="lg" variant="secondary" className="shadow-lg">
                    <Link href="/cadastrar?role=vendedor">
                        <ShoppingCart className="mr-2 h-5 w-5" /> Virar um Vendedor
                    </Link>
                </Button>
            </CardFooter>
          </Card>
        )}
        
      </main>

      <div className="fixed bottom-6 left-6 z-50">
        <Popover>
          <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 bg-card/80 backdrop-blur-sm shadow-lg border-border/50">
                <Settings className="h-6 w-6 text-muted-foreground" />
                <span className="sr-only">Configurações de Administrador</span>
              </Button>
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
