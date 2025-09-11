
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
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        <path fill="none" d="M1 1h22v22H1z"/>
    </svg>
);


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, currentUser, isLoading: authLoading } = useAuth();
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
          <div className="space-y-6">
            <Button variant="outline" className="w-full" onClick={loginWithGoogle}>
              <GoogleIcon />
              <span className="ml-2">Entrar com Google</span>
            </Button>
            
            <div className="flex items-center space-x-2">
                <Separator className="flex-grow" />
                <span className="text-xs text-muted-foreground">OU</span>
                <Separator className="flex-grow" />
            </div>

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
                {authLoading ? 'Entrando...' : 'Entrar com E-mail'}
              </Button>
            </form>
          </div>
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
