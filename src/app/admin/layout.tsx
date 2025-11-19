
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
    SidebarInset,
    useSidebar,
    SidebarSeparator
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Ticket, Home, User as UserIcon, Settings, PlusCircle, ShieldCheck, PieChart, History, Trophy, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { SuspenseWrapper } from '@/components/suspense-wrapper';

const menuItems: { id: string; label: string; Icon: React.ElementType }[] = [
  { id: 'configuracoes', label: 'Configurações', Icon: Settings },
  { id: 'cadastrar-sorteio', label: 'Cadastrar Sorteio', Icon: PlusCircle },
  { id: 'controles-loteria', label: 'Controles', Icon: ShieldCheck },
  { id: 'ranking-ciclo', label: 'Ranking do Ciclo', Icon: TrendingUp },
  { id: 'relatorios', label: 'Relatórios', Icon: PieChart },
  { id: 'historico-sorteios', label: 'Resultados', Icon: History },
  { id: 'bilhetes-premiados', label: 'Bilhetes Premiados', Icon: Trophy },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();
  
  const activeSection = searchParams.get('section') || 'configuracoes';

  useEffect(() => {
    // This effect handles authentication and authorization for the admin section.
    if (isLoading) {
      // Wait until the authentication check is complete.
      return;
    }

    if (!isAuthenticated) {
      // If the user is not authenticated, redirect to the login page.
      // Pass the current path as a redirect parameter so they can come back after login.
      router.replace('/login?redirect=' + pathname);
      return;
    }

    if (currentUser && currentUser.role !== 'admin') {
      // If the authenticated user is not an admin, they are not authorized.
      // Redirect them to their own default dashboard.
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [isLoading, isAuthenticated, currentUser, router, pathname]);


  // While loading, or if the user is not authenticated/authorized yet, show a loading screen.
  // This prevents content from flashing before the redirect logic in useEffect runs.
  if (isLoading || !isAuthenticated || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Verificando permissões de Admin...</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
             <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
             <div className="flex flex-col">
                <span className="text-lg font-semibold text-black dark:text-white">Bolão Potiguar</span>
                <span className="text-xs text-black/80 dark:text-white/80 -mt-1">
                  Painel de Administrador
                </span>
             </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex flex-col p-2">
            <div className="mb-4 p-3 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground">
                <div className="text-sm font-medium">Administrador:</div>
                <div className="text-lg font-bold flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback>{currentUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{currentUser.username}</span>
                </div>
            </div>

            <SidebarMenu>
                {menuItems.map(item => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={activeSection === item.id}
                          onClick={() => setOpenMobile(false)}
                        >
                            <Link href={`/admin?section=${item.id}`}>
                                <item.Icon /> {item.label}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>

            <div className="mt-auto">
              <SidebarMenu>
                  <SidebarSeparator className="my-2" />
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild onClick={() => setOpenMobile(false)}>
                          <Link href="/">
                              <Home /> Página Inicial
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => { logout(); setOpenMobile(false); }} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <LogOut /> Sair da Conta
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
              <div className="flex items-center justify-center p-2">
                  <ThemeToggleButton />
              </div>
            </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1">
        <header className="flex h-14 items-center justify-between border-b bg-secondary px-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-2">
                 <SidebarTrigger />
                 <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-1 md:hidden">
                    <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
                    <span className="sm:inline-block">Bolão Potiguar</span>
                </Link>
            </div>
            <span className="font-semibold text-primary">Painel do Admin</span>
        </header>
        <div className="p-4 md:p-8 flex-1 bg-gradient-to-b from-emerald-700 to-emerald-900">
            <div className="mb-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center">
                    Área Administrativa
                </h1>
                <p className="text-lg text-white/80 mt-2 text-center">Gerenciamento de Sorteios, Bilhetes e Configurações</p>
            </div>
            {children}
        </div>
        <footer className="mt-auto py-8 text-center border-t border-border/50 bg-secondary">
            <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bolão Potiguar - Admin.
            </p>
        </footer>
      </SidebarInset>
    </>
  );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <SuspenseWrapper>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </SuspenseWrapper>
        </SidebarProvider>
    );
}
