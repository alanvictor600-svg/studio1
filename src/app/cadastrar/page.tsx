
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { UserPlus, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        <path fill="none" d="M1 1h22v22H1z"/>
    </svg>
);

export default function CadastroPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente');
  const { register, currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const roleFromQuery = searchParams.get('role');
    if (roleFromQuery === 'cliente' || roleFromQuery === 'vendedor') {
      setRole(roleFromQuery);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
         toast({ title: "Erro de Cadastro", description: "Nome de usuário inválido. Use apenas letras, números e os caracteres: . - _", variant: "destructive" });
         return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Erro de Cadastro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (!username || !password || !role) {
       toast({ title: "Erro de Cadastro", description: "Todos os campos são obrigatórios.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
        toast({ title: "Erro de Cadastro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
        return;
    }
    await register(username.trim(), password, role);
  };
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" passHref>
          <Button variant="outline" className="h-10 w-10 p-0 sm:w-auto sm:px-3 sm:py-2 flex items-center justify-center sm:justify-start shadow-md">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline-block sm:ml-2">Voltar</span>
          </Button>
        </Link>
      </div>
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggleButton />
      </div>

      <Card className="w-full max-w-md shadow-xl bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader className="text-center">
            <Image src="/logo.png" alt="Logo Bolão Potiguar" width={80} height={80} className="mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Crie sua Conta de {role === 'cliente' ? 'Cliente' : 'Vendedor'}</CardTitle>
          <CardDescription className="text-muted-foreground">
            Rápido e fácil. Escolha seu método preferido abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Button variant="outline" className="w-full h-12 text-base" onClick={() => toast({ title: 'Indisponível', description: 'Login com Google será ativado em breve.', variant: 'default' })} disabled>
              <GoogleIcon />
              <span className="ml-2">Continuar com Google</span>
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
                  placeholder="Escolha um nome de usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background/70 h-11"
                />
                <p className="text-xs text-muted-foreground">Apenas letras, números e os caracteres . - _</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                 <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Crie uma senha (mínimo 6 caracteres)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/70 h-11 pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                 <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-background/70 h-11 pr-10"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-12" disabled={authLoading}>
                 <UserPlus className="mr-2 h-5 w-5" />
                {authLoading ? 'Registrando...' : 'Registrar com E-mail'}
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">Já tem uma conta?</p>
          <Link href="/login" passHref>
            <Button variant="link" className="text-primary h-auto py-1 px-2">
              <LogIn className="mr-2 h-4 w-4" /> Faça login aqui
            </Button>
          </Link>
        </CardFooter>
      </Card>
      <p className="mt-8 text-xs text-center text-muted-foreground max-w-md">
        Atenção: Este sistema de cadastro é simplificado para fins de prototipagem e armazena dados localmente.
        Não utilize senhas reais ou informações sensíveis.
      </p>
    </div>
  );
}
