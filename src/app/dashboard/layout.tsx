
"use client";

import { useEffect, useRef, Suspense } from 'react';
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
import { LogOut, Coins, Home, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { ShoppingCart } from '@/components/shopping-cart';
import { DashboardProvider, useDashboard } from '@/context/dashboard-context';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog';
import { TicketReceiptDialog } from '@/components/ticket-receipt-dialog';
import DashboardLoading from './loading';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { currentUser, logout, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { role } = params as { role: 'cliente' | 'vendedor' };
  const { setOpenMobile } = useSidebar();

  const { 
    cart, 
    setCart, 
    handlePurchaseCart, 
    isSubmitting, 
    lotteryConfig,
    receiptTickets,
    setReceiptTickets,
    startDataListeners,
    isDataLoading,
    showCreditsDialog,
    isCreditsDialogOpen
  } = useDashboard();
  
  const cleanupListenersRef = useRef<(() => void) | null>(null);

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
                    <Link href={dashboardPath} passHref>
                        <SidebarMenuButton isActive={pathname === dashboardPath} onClick={() => setOpenMobile(false)}>
                            <LayoutDashboard />
                            <span>Meu Painel</span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 
                <SidebarMenuItem>
                    <Link href="/solicitar-saldo" passHref>
                        <SidebarMenuButton className="bg-green-600 hover:bg-green-700 text-white font-semibold text-base h-12" onClick={() => setOpenMobile(false)}>
                            <Coins /> 
                            <span>Adquirir Saldo</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarSeparator className="my-2" />
                 <SidebarMenuItem>
                    <Link href="/" passHref>
                        <SidebarMenuButton onClick={() => setOpenMobile(false)}>
                            <Home /> <span>Página Inicial</span>
                        </SidebarMenuButton>
                    </Link>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => { logout(); setOpenMobile(false); }} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <LogOut /> <span>Sair da Conta</span>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center justify-center p-2">
                <ThemeToggleButton />
            </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-secondary px-4 md:px-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                 <span className="hidden md:inline font-semibold text-primary">{currentUser.role === 'cliente' ? 'Painel do Cliente' : 'Painel do Vendedor'}</span>
            </div>

             <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-2 md:hidden">
                <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
            </Link>

            <div className="flex items-center justify-end">
                {currentUser.role === 'cliente' && (
                    <ShoppingCart 
                        cart={cart}
                        currentUser={currentUser}
                        lotteryConfig={lotteryConfig}
                        onPurchase={handlePurchaseCart}
                        onRemoveFromCart={(index) => setCart(cart.filter((_, i) => i !== index))}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </header>

        <main className="flex-1 p-4 md:p-8 bg-gradient-to-b from-emerald-700 to-emerald-900 overflow-y-auto">
           {isDataLoading ? <DashboardLoading /> : children}
        </main>

        <InsufficientCreditsDialog
            isOpen={isCreditsDialogOpen}
            onOpenChange={(isOpen) => { if(!isOpen) showCreditsDialog(false) }}
        />
        <TicketReceiptDialog
            isOpen={!!receiptTickets}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setReceiptTickets(null);
              }
            }}
            tickets={receiptTickets}
            lotteryConfig={lotteryConfig}
        />
      </div>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardProvider>
        <Suspense>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </Suspense>
      </DashboardProvider>
    </SidebarProvider>
  );
}
