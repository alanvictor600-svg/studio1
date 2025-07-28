
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, ShoppingCart, ShieldCheck, ArrowRight, Settings, LogIn, UserPlus, LogOut, History, Award, PanelTopOpen } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import type { Draw, Ticket } from '@/types';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { TopTickets } from '@/components/TopTickets';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const DRAWS_STORAGE_KEY = 'bolaoPotiguarDraws';
const CLIENTE_TICKETS_STORAGE_KEY = 'bolaoPotiguarClienteTickets';
const VENDEDOR_TICKETS_STORAGE_KEY = 'bolaoPotiguarVendedorTickets';


export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);
  const { currentUser, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);


  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem(DRAWS_STORAGE_KEY);
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
    const clientTicketsRaw = localStorage.getItem(CLIENTE_TICKETS_STORAGE_KEY);
    const clientTickets = clientTicketsRaw ? JSON.parse(clientTicketsRaw) : [];

    const vendedorTicketsRaw = localStorage.getItem(VENDEDOR_TICKETS_STORAGE_KEY);
    const vendedorTickets = vendedorTicketsRaw ? JSON.parse(vendedorTicketsRaw) : [];

    setAllTickets([...clientTickets, ...vendedorTickets]);
  }, []);

  const handleClienteClick = () => {
    if (currentUser && currentUser.role === 'cliente') {
      router.push('/cliente');
    } else if (currentUser && currentUser.role !== 'cliente') {
      router.push('/login?redirect=/cliente');
    }
     else {
      router.push('/login?redirect=/cliente');
    }
  };

  const handleVendedorClick = () => {
     if (currentUser && currentUser.role === 'vendedor') {
      router.push('/vendedor');
    } else if (currentUser && currentUser.role !== 'vendedor') {
      router.push('/login?redirect=/vendedor');
    }
     else {
      router.push('/login?redirect=/vendedor');
    }
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
       {draws.length > 0 && (
          <div className="fixed top-6 left-6 z-50">
            <Popover>
              <PopoverTrigger asChild>
                  <Button>
                    <LogIn className="mr-2 h-5 w-5" /> Entrar na sua conta
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Acesso Rápido</h4>
                    <p className="text-sm text-muted-foreground">
                      Escolha seu painel para continuar ou cadastre-se.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Button onClick={handleClienteClick} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Users className="mr-2 h-4 w-4" /> {currentUser && currentUser.role === 'cliente' ? "Meu Painel de Cliente" : "Entrar como Cliente"}
                    </Button>
                    <Button onClick={handleVendedorClick} variant="secondary" className="w-full">
                      <ShoppingCart className="mr-2 h-4 w-4" /> {currentUser && currentUser.role === 'vendedor' ? "Meu Painel de Vendas" : "Entrar como Vendedor"}
                    </Button>
                    {!currentUser && (
                        <Link href="/cadastrar" passHref className="mt-2">
                          <Button variant="link" className="w-full">
                            <UserPlus className="mr-2 h-4 w-4" /> Ainda não tem conta? Cadastre-se!
                          </Button>
                        </Link>
                      )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
       )}

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
                <p>Sair</p>
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
        {draws.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h2 className="text-2xl font-bold text-primary text-center mb-4 flex items-center justify-center">
                  <History className="mr-3 h-6 w-6" /> Último Sorteio
               </h2>
               <AdminDrawCard draw={draws[0]} />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary text-center mb-4 flex items-center justify-center">
                  <Award className="mr-3 h-6 w-6" /> Placar de Acertos
              </h2>
              <TopTickets tickets={allTickets} draws={draws} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-primary text-center mb-6">A loteria ainda não começou!</h2>
            <p className="text-muted-foreground mb-8 text-center">Escolha um perfil abaixo para começar.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="items-center text-center">
                    <Users className="w-12 h-12 text-primary mb-2" />
                    <CardTitle className="text-2xl">Acessar como Cliente</CardTitle>
                    <CardDescription>Compre e gerencie seus bilhetes.</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={handleClienteClick} className="w-full">
                       {currentUser && currentUser.role === 'cliente' ? "Ir para o Painel" : "Entrar como Cliente"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                   <CardHeader className="items-center text-center">
                    <ShoppingCart className="w-12 h-12 text-secondary mb-2" />
                    <CardTitle className="text-2xl">Acessar como Vendedor</CardTitle>
                    <CardDescription>Venda bilhetes e acompanhe seu desempenho.</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={handleVendedorClick} variant="secondary" className="w-full">
                      {currentUser && currentUser.role === 'vendedor' ? "Ir para o Painel" : "Entrar como Vendedor"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 left-6 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Opções de Administrador" className="shadow-lg rounded-full">
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <Link href="/admin" passHref legacyBehavior>
              <Button variant="destructive" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <ShieldCheck className="mr-2 h-4 w-4" /> Acessar Admin
              </Button>
            </Link>
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
