
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { User, LotteryConfig } from '@/types';
import Link from 'next/link';

import { 
    Sidebar, 
    SidebarProvider, 
    SidebarTrigger, 
    SidebarContent, 
    SidebarHeader, 
    SidebarFooter, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarInset 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Ticket, Home, User as UserIcon, FileText, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Separator } from '@/components/ui/separator';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se o carregamento terminou e o usuário não está autenticado,
    // redireciona para a página de login.
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=' + pathname);
    }
  }, [isLoading, isAuthenticated, router, pathname]);


  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Verificando sessão...</p>
      </div>
    );
  }
  
  // Se, após o carregamento, o usuário não tiver o perfil esperado (cliente/vendedor),
  // não renderiza nada. O useEffect acima já terá iniciado o redirecionamento.
  if (currentUser.role !== 'cliente' && currentUser.role !== 'vendedor') {
      return (
         <div className="flex justify-center items-center min-h-screen bg-background">
            <p className="text-foreground text-xl">Acesso negado. Redirecionando...</p>
        </div>
      );
  }

  const isSeller = currentUser.role === 'vendedor';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3">
             <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
             <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-primary">Bolão Potiguar</span>
                <span className="text-xs text-sidebar-foreground/80 -mt-1">
                  Painel de {currentUser.role === 'cliente' ? 'Cliente' : 'Vendedor'}
                </span>
             </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
            <div className="mb-4 p-3 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground">
                <div className="text-sm font-medium">Bem-vindo(a)!</div>
                <div className="text-lg font-bold flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback>{currentUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{currentUser.username}</span>
                </div>
                <Separator className="my-2 bg-sidebar-border" />
                <div className="text-sm font-medium">Seu Saldo:</div>
                <div className="text-2xl font-bold text-yellow-400 flex items-center gap-1.5">
                    <Coins size={22} />
                    <span>R$ {(currentUser.saldo || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>

            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === `/dashboard/${currentUser.role}`}>
                        <Link href={`/dashboard/${currentUser.role}`}>
                            {isSeller ? <ShoppingBag /> : <Ticket />}
                            {isSeller ? ' Vendas' : ' Fazer Aposta'}
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 {isSeller && (
                    <SidebarMenuItem>
                         <SidebarMenuButton asChild isActive={pathname.includes('/relatorios')}>
                             <Link href="/dashboard/vendedor/relatorios">
                                <FileText /> Relatórios
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                    <SidebarMenuButton asChild variant="secondary" className="bg-green-500/80 text-white hover:bg-green-600/90 font-semibold text-base h-12">
                         <Link href="/solicitar-saldo">
                            <Coins className="mr-2 h-5 w-5" /> Adquirir Saldo
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild variant="ghost">
                        <Link href="/">
                            <Home /> Página Inicial
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={logout} variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <LogOut /> Sair da Conta
                    </SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center justify-end p-2">
                <ThemeToggleButton />
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:hidden sticky top-0 z-10">
            <SidebarTrigger />
            <span className="font-semibold text-primary">{currentUser.role === 'cliente' ? 'Painel do Cliente' : 'Painel do Vendedor'}</span>
            <div/>
        </header>
        <div className="p-4 md:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
