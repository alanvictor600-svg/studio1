
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && currentUser) {
      const redirectPath = searchParams.get('redirect');
      // If user is already logged in, redirect them to their correct dashboard.
      router.push(redirectPath || (currentUser.role === 'cliente' ? '/cliente' : '/vendedor'));
    }
  }, [currentUser, authLoading, router, searchParams, isClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      return;
    }
    const redirectPath = searchParams.get('redirect');
    const expectedRole = redirectPath?.includes('cliente') ? 'cliente' : redirectPath?.includes('vendedor') ? 'vendedor' : undefined;

    await login(username, password, expectedRole);
  };
  
  if (authLoading && isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Verificando autenticação...</p>
      </div>
    );
  }
  
   if (isClient && currentUser) {
     return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
            <p className="text-foreground text-lg mb-4">Você já está logado como {currentUser.username}.</p>
            <Button onClick={() => router.push(currentUser.role === 'cliente' ? '/cliente' : '/vendedor')}> 
                Ir para o painel
            </Button>
        </div>
     );
   }


  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggleButton />
      </div>
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50">
        <Link href="/" passHref>
          <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:justify-start">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline-block sm:ml-2">Voltar para Home</span>
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Login</CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesse sua conta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3" disabled={authLoading}>
              {authLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">Não tem uma conta?</p>
          <Link href="/cadastrar" passHref>
            <Button variant="link" className="text-primary">
              <UserPlus className="mr-2 h-4 w-4" /> Cadastre-se aqui
            </Button>
          </Link>
        </CardFooter>
      </Card>
        <p className="mt-8 text-xs text-center text-muted-foreground max-w-md">
          Atenção: Este sistema de login é simplificado para fins de prototipagem e armazena dados localmente.
          Não utilize senhas reais ou informações sensíveis.
        </p>
    </div>
  );
}
