
"use client";

import { useEffect, useRef } from 'react';
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
    SidebarInset,
    useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Home, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart } from '@/components/shopping-cart';
import { DashboardProvider, useDashboard } from '@/context/dashboard-context';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog';
import { TicketReceiptDialog } from '@/components/ticket-receipt-dialog';

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
    isCreditsDialogOpen,
    setIsCreditsDialogOpen,
    receiptTickets,
    setReceiptTickets,
    startDataListeners,
    isDataLoading
  } = useDashboard();
  
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // This effect handles authentication and authorization for the dashboard.
    if (isAuthLoading) {
      // Don't do anything while auth state is resolving.
      return;
    }

    if (!isAuthenticated) {
      // If user is not logged in, redirect to login page, preserving the intended destination.
      router.replace('/login?redirect=' + pathname);
      return;
    }

    if (currentUser && currentUser.role !== role) {
      // If user is logged in but trying to access the wrong role's dashboard,
      // redirect them to their correct dashboard.
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [isAuthLoading, isAuthenticated, currentUser, role, router, pathname]);

  // Effect to start/stop data listeners based on auth state
  useEffect(() => {
    // Only start listeners if the user is authenticated and correctly authorized for the current dashboard role.
    if (isAuthenticated && currentUser && currentUser.role === role) {
      cleanupListenersRef.current = startDataListeners(currentUser);
    }

    // Cleanup function to run when the component unmounts or dependencies change.
    return () => {
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null; // Prevent multiple cleanups
      }
    };
  }, [isAuthenticated, currentUser, role, startDataListeners]);


  // While authentication is loading, or if we are waiting for a redirect to happen, show a loading screen.
  if (isAuthLoading || !isAuthenticated || !currentUser || currentUser.role !== role) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando painel...</p>
      </div>
    );
  }

  const isSeller = currentUser.role === 'vendedor';
  const dashboardPath = `/dashboard/${currentUser.role}`;

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
             <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
             <div className="flex flex-col">
                <span className="text-lg font-semibold text-black dark:text-white">Bolão Potiguar</span>
                <span className="text-xs text-black/80 dark:text-white/80 -mt-1">
                  Painel de {currentUser.role === 'cliente' ? 'Cliente' : 'Vendedor'}
                </span>
             </div>
          </Link>
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
                    <SidebarMenuButton asChild isActive={pathname === dashboardPath} onClick={() => setOpenMobile(false)}>
                        <Link href={dashboardPath}>
                            <LayoutDashboard />
                            Meu Painel
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="bg-green-500/80 text-white hover:bg-green-600/90 font-semibold text-base h-12" onClick={() => setOpenMobile(false)}>
                         <Link href="/solicitar-saldo">
                            <Coins className="mr-2 h-5 w-5" /> Adquirir Saldo
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center justify-center p-2">
                <ThemeToggleButton />
            </div>
            <SidebarMenu>
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
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col flex-1 overflow-x-hidden">
        {/* Mobile Header - REFACTORED FOR PERFECT CENTERING */}
        <header className="sticky top-0 z-10 grid h-16 grid-cols-3 items-center border-b bg-secondary px-2 md:hidden">
          <div className="flex justify-start">
            <SidebarTrigger />
          </div>
          <div className="flex justify-center">
            <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo Bolão Potiguar" width={32} height={32} />
              <span className="hidden sm:inline-block font-semibold">Bolão Potiguar</span>
            </Link>
          </div>
          <div className="flex items-center justify-end">
             {currentUser.role === 'cliente' && !isDataLoading && (
              <ShoppingCart 
                  cart={cart}
                  currentUser={currentUser}
                  lotteryConfig={lotteryConfig}
                  isSubmitting={isSubmitting}
                  onPurchase={handlePurchaseCart}
                  onRemoveFromCart={(index) => setCart(cart.filter((_, i) => i !== index))}
              />
            )}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-14 items-center justify-between border-b bg-secondary px-6 sticky top-0 z-10">
             <span className="font-semibold text-primary">{currentUser.role === 'cliente' ? 'Painel do Cliente' : 'Painel do Vendedor'}</span>
             <div className="flex items-center justify-end gap-4">
                {currentUser.role === 'cliente' && !isDataLoading && (
                    <ShoppingCart 
                        cart={cart}
                        currentUser={currentUser}
                        lotteryConfig={lotteryConfig}
                        isSubmitting={isSubmitting}
                        onPurchase={handlePurchaseCart}
                        onRemoveFromCart={(index) => setCart(cart.filter((_, i) => i !== index))}
                    />
                )}
            </div>
        </header>


        <main className="p-4 md:p-8 flex-1 bg-gradient-to-b from-emerald-700 to-emerald-900">
            {isDataLoading ? (
                <div className="text-center p-10 text-white">Carregando dados...</div>
            ) : children}
        </main>
        <InsufficientCreditsDialog
            isOpen={isCreditsDialogOpen}
            onOpenChange={setIsCreditsDialogOpen}
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
      </SidebarInset>
    </>
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
