
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
    SidebarInset 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Ticket, Home, User as UserIcon, Settings, PlusCircle, ShieldCheck, PieChart, History, Trophy, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Separator } from '@/components/ui/separator';

const menuItems: { id: string; label: string; Icon: React.ElementType }[] = [
  { id: 'configuracoes', label: 'Configurações', Icon: Settings },
  { id: 'cadastrar-sorteio', label: 'Cadastrar Sorteio', Icon: PlusCircle },
  { id: 'controles-loteria', label: 'Controles', Icon: ShieldCheck },
  { id: 'relatorios', label: 'Relatórios', Icon: PieChart },
  { id: 'historico-sorteios', label: 'Resultados', Icon: History },
  { id: 'bilhetes-premiados', label: 'Bilhetes Premiados', Icon: Trophy },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const activeSection = searchParams.get('section') || 'configuracoes';

  useEffect(() => {
    // This effect handles redirection for users who are not authenticated admins
    // after the initial authentication check is complete.
    if (!isLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      router.replace('/login?redirect=/admin');
    }
  }, [isLoading, isAuthenticated, currentUser, router]);


  // While loading, or if the user is not authenticated yet, show a loading screen.
  // This prevents content from flashing before the redirect logic in useEffect runs.
  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-white text-xl">Verificando sessão de Admin...</p>
      </div>
    );
  }

  // After loading, if the user is still not an admin, return null.
  // The useEffect will handle the redirection, so we don't need to render anything.
  if (currentUser.role !== 'admin') {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-3">
             <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
             <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-primary">Bolão Potiguar</span>
                <span className="text-xs text-sidebar-foreground/80 -mt-1">
                  Painel de Administrador
                </span>
             </div>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
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
                        >
                            <Link href={`/admin?section=${item.id}`}>
                                <item.Icon /> {item.label}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
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
      <SidebarInset className="flex flex-col flex-1 min-h-screen">
        <header className="flex h-14 items-center justify-between border-b bg-secondary px-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-2">
                 <SidebarTrigger />
                 <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                    <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
                    <span className="hidden sm:inline-block">Bolão Potiguar</span>
                </Link>
            </div>
            <span className="font-semibold text-primary">Painel do Admin</span>
            <ThemeToggleButton />
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
    </SidebarProvider>
  );
}
