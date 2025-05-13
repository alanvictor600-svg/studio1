
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, ShoppingCart, ShieldCheck, ArrowRight, Settings } from 'lucide-react';

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Bolão Potiguar...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
      <header className="mb-12 text-center">
        <div className="inline-block p-3 rounded-full bg-primary shadow-lg mb-4">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="hsl(var(--primary-foreground))" xmlns="http://www.w3.org/2000/svg" data-ai-hint="lottery ball">
            <circle cx="12" cy="12" r="10" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5"/>
            <text x="12" y="16" fontSize="10" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontWeight="bold">BP</text>
          </svg>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
          Bolão Potiguar
        </h1>
        <p className="text-xl text-muted-foreground mt-3">Bem-vindo! Escolha seu perfil para continuar.</p>
      </header>

      <main className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link href="/comprador" passHref legacyBehavior>
          <a className="block transform hover:scale-105 transition-transform duration-300">
            <Card className="text-center h-full flex flex-col justify-between shadow-xl hover:shadow-2xl bg-card/90 backdrop-blur-sm border-primary/50">
              <CardHeader>
                <Users className="mx-auto h-16 w-16 text-primary mb-4" />
                <CardTitle className="text-2xl font-bold text-primary">Comprador</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Compre seus bilhetes e tente a sorte!
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pb-6">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Entrar como Comprador <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </a>
        </Link>

        <Link href="/vendedor" passHref legacyBehavior>
          <a className="block transform hover:scale-105 transition-transform duration-300">
            <Card className="text-center h-full flex flex-col justify-between shadow-xl hover:shadow-2xl bg-card/90 backdrop-blur-sm border-secondary/50">
              <CardHeader>
                <ShoppingCart className="mx-auto h-16 w-16 text-secondary mb-4" />
                <CardTitle className="text-2xl font-bold text-secondary">Vendedor</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gerencie suas vendas e acompanhe os resultados.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pb-6">
                <Button variant="secondary" className="w-full">
                  Entrar como Vendedor <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </a>
        </Link>
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
