
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from '@/context/auth-context';
import { UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleButton } from '@/components/theme-toggle-button';

export default function CadastroPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente'); // Changed 'comprador' to 'cliente'
  const { register, currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && currentUser) {
      router.push(currentUser.role === 'cliente' ? '/cliente' : '/vendedor'); // Changed 'comprador' to 'cliente' and path
    }
  }, [currentUser, authLoading, router, isClient]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erro de Cadastro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (!username || !password || !role) {
       toast({ title: "Erro de Cadastro", description: "Todos os campos são obrigatórios.", variant: "destructive" });
      return;
    }
    await register(username, password, role);
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
            <p className="text-foreground text-lg mb-4">Você já está logado como {currentUser.username}. Não é possível se cadastrar.</p>
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
          <UserPlus className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Criar Conta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Preencha os campos para se registrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background/70"
              />
            </div>
            <div className="space-y-3">
              <Label>Qual seu perfil?</Label>
              <RadioGroup 
                defaultValue="cliente" // Changed 'comprador' to 'cliente'
                onValueChange={(value) => setRole(value as 'cliente' | 'vendedor')} // Changed 'comprador' to 'cliente'
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cliente" id="role-cliente" /> 
                  <Label htmlFor="role-cliente" className="font-normal">Cliente</Label> 
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vendedor" id="role-vendedor" />
                  <Label htmlFor="role-vendedor" className="font-normal">Vendedor</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-3" disabled={authLoading}>
              {authLoading ? 'Registrando...' : 'Registrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-sm text-muted-foreground">Já tem uma conta?</p>
          <Link href="/login" passHref>
            <Button variant="link" className="text-primary">
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
