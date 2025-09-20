
"use client";

import { useEffect } from 'react';
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
    SidebarInset 
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
    startDataListeners, // New function from context
    isDataLoading
  } = useDashboard();

  // Effect to start data listeners when user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      startDataListeners(currentUser);
    }
  }, [isAuthenticated, currentUser, startDataListeners]);


  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login?redirect=' + pathname);
    }
  }, [isAuthLoading, isAuthenticated, router, pathname]);

  useEffect(() => {
    // This handles the case where a user might try to access the wrong dashboard,
    // e.g., a client accessing /dashboard/vendedor.
    if (!isAuthLoading && isAuthenticated && currentUser && currentUser.role !== role) {
      // Redirect to their correct dashboard.
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [isAuthLoading, isAuthenticated, currentUser, role, router]);


  if (isAuthLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-white text-xl">Verificando sessão...</p>
      </div>
    );
  }
  
  if (currentUser.role !== role) {
      return (
         <div className="flex justify-center items-center min-h-screen">
            <p className="text-white text-xl">Acesso negado. Redirecionando...</p>
        </div>
      );
  }

  const isSeller = currentUser.role === 'vendedor';
  const dashboardPath = `/dashboard/${currentUser.role}`;

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
                    <SidebarMenuButton asChild isActive={pathname === dashboardPath}>
                        <Link href={dashboardPath}>
                            <LayoutDashboard />
                            Meu Painel
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 
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
      <SidebarInset className="flex flex-col flex-1 min-h-screen">
        <header className="flex h-14 items-center justify-between border-b bg-secondary px-4 md:px-6 sticky top-0 z-10">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <span className="font-semibold text-primary hidden md:block">{currentUser.role === 'cliente' ? 'Painel do Cliente' : 'Painel do Vendedor'}</span>
            <div className="flex items-center gap-4 ml-auto">
                {currentUser.role === 'cliente' && (
                    <ShoppingCart 
                        cart={cart}
                        currentUser={currentUser}
                        lotteryConfig={lotteryConfig}
                        isSubmitting={isSubmitting}
                        onPurchase={handlePurchaseCart}
                        onRemoveFromCart={(index) => setCart(cart.filter((_, i) => i !== index))}
                    />
                )}
                <ThemeToggleButton />
            </div>
        </header>
        <main className="p-4 md:p-8 flex-1">
            {isDataLoading && !children ? (
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
    </SidebarProvider>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
