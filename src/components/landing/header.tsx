"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

export const Header = () => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();

  const dashboardPath = currentUser?.role === 'admin' 
      ? '/admin' 
      : (currentUser ? `/dashboard/${currentUser.role}` : '/login');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-secondary">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
          <span className="hidden sm:inline-block text-foreground">Bolão Potiguar</span>
        </Link>
        <div className="flex items-center gap-2">
            {isLoading ? (
                <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : isAuthenticated ? (
                <Button asChild>
                    <Link href={dashboardPath}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Painel</Link>
                </Button>
            ) : (
                <>
                    <Button asChild variant="outline">
                        <Link href="/login"><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/cadastrar"><UserPlus className="mr-2 h-4 w-4" /> Cadastrar</Link>
                    </Button>
                </>
            )}
        </div>
      </div>
    </header>
  );
};
