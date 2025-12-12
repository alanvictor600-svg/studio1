
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
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
    useSidebar,
    SidebarSeparator
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Home, LayoutDashboard, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { DashboardProvider, useDashboard } from '@/context/dashboard-context';
import DashboardLoading from './loading';
import { ShoppingCart } from '@/components/shopping-cart';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { role } = params as { role: 'cliente' | 'vendedor' };
  const { setOpenMobile } = useSidebar();

  const { startDataListeners, isDataLoading, lotteryConfig } = useDashboard();
  
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const handleForceRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      router.replace('/login?redirect=' + pathname);
    } else if (currentUser && currentUser.role !== role) {
      const targetRole = currentUser.role === 'admin' ? 'admin' : `dashboard/${currentUser.role}`;
      router.replace(`/${targetRole}`);
    }
  }, [isAuthLoading, isAuthenticated, currentUser, role, router, pathname]);

  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.role === role) {
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
      }
      cleanupListenersRef.current = startDataListeners(currentUser);
    }

    return () => {
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }
    };
  }, [isAuthenticated, currentUser, role, startDataListeners]);


  if (isAuthLoading || !isAuthenticated || !currentUser || currentUser.role !== role) {
    return <DashboardLoading />;
  }

  const dashboardPath = `/dashboard/${currentUser.role}`;

  return (
    <div className="flex h-screen">
      <Sidebar>
        <SidebarHeader>
          <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
             <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
             <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-foreground">Bolão Potiguar</span>
                <span className="text-xs text-sidebar-foreground/80 -mt-1">
                  Painel de {currentUser.role === 'cliente' ? 'Cliente' : 'Vendedor'}
                </span>
             </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
            <div className="mb-4 p-3 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground">
                <div className="text-sm font-medium">Bem-vindo(a)!</div>
                <div className="text-lg font-bold flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback>{currentUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{currentUser.username}</span>
                </div>
                <SidebarSeparator className="my-2 bg-sidebar-border" />
                <div className="text-sm font-medium">Seu Saldo:</div>
                <div className="text-2xl font-bold text-yellow-400 flex items-center gap-1.5">
                    <Coins size={22} />
                    <span>R$ {(currentUser.saldo || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>

            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href={dashboardPath} passHref legacyBehavior>
                        <SidebarMenuButton as="a" isActive={pathname === dashboardPath} onClick={() => setOpenMobile(false)}>
                            <span className="flex items-center gap-2">
                                <LayoutDashboard />
                                <span>Meu Painel</span>
                            </span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 
                <SidebarMenuItem>
                    <Link href="/solicitar-saldo" passHref legacyBehavior>
                        <SidebarMenuButton as="a" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-base h-12" onClick={() => setOpenMobile(false)}>
                            <span className="flex items-center gap-2">
                                <Coins /> 
                                <span>Adquirir Saldo</span>
                            </span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarSeparator className="my-2" />
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleForceRefresh} variant="outline">
                        <span className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" /> 
                            <span>Atualizar Dados</span>
                        </span>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/" passHref legacyBehavior>
                        <SidebarMenuButton as="a" onClick={() => setOpenMobile(false)}>
                            <span className="flex items-center gap-2">
                                <Home /> <span>Página Inicial</span>
                            </span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => { logout(); setOpenMobile(false); }} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <span className="flex items-center gap-2">
                            <LogOut /> <span>Sair da Conta</span>
                        </span>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center justify-center p-2">
                <ThemeToggleButton />
            </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-secondary px-4 md:px-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                 <span className="hidden md:inline font-semibold text-primary">{currentUser.role === 'cliente' ? 'Painel do Cliente' : 'Painel do Vendedor'}</span>
            </div>

             <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-2 md:hidden">
                <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
            </Link>

            <div className="flex items-center justify-end">
                {currentUser && currentUser.role === 'cliente' && (
                    <div data-slot="shopping-cart-container"></div>
                )}
            </div>
        </header>

        <main className="flex-1 p-4 md:p-8 bg-gradient-to-b from-emerald-700 to-emerald-900 overflow-y-auto">
           {isDataLoading ? <DashboardLoading /> : children}
        </main>
      </div>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </DashboardProvider>
    </SidebarProvider>
  );
}
