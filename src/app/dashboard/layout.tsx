
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
    useSidebar,
    SidebarSeparator
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Home, LayoutDashboard, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { ShoppingCart } from '@/components/shopping-cart';
import { DashboardProvider, useDashboard } from '@/context/dashboard-context';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog';
import { TicketReceiptDialog } from '@/components/ticket-receipt-dialog';
import { useToast } from '@/hooks/use-toast';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { currentUser, logout, isLoading: isAuthLoading, isAuthenticated } = useAuth();
    const { setOpenMobile } = useSidebar();
    const { toast } = useToast();
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
        startDataListeners,
        isDataLoading
    } = useDashboard();
    
    const cleanupListenersRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (isAuthLoading) return;

        if (!isAuthenticated) {
            router.replace('/login?redirect=' + pathname);
            return;
        }

        if (currentUser && currentUser.role !== role) {
            router.replace(`/dashboard/${currentUser.role}`);
        }
    }, [isAuthLoading, isAuthenticated, currentUser, role, router, pathname]);

    useEffect(() => {
        if (isAuthenticated && currentUser && currentUser.role === role && !cleanupListenersRef.current) {
            cleanupListenersRef.current = startDataListeners(currentUser);
        }
        return () => {
            if (cleanupListenersRef.current) {
                cleanupListenersRef.current();
                cleanupListenersRef.current = null;
            }
        };
    }, [isAuthenticated, currentUser, role, startDataListeners]);

    const handleForceRefresh = async () => {
        setOpenMobile(false);
        toast({
            title: 'Forçando Atualização...',
            description: 'Limpando cache e recarregando os dados mais recentes.',
        });

        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            window.location.reload();
        } catch (error) {
            console.error('Falha ao forçar a atualização:', error);
            toast({
                title: 'Erro na Atualização',
                description: 'Não foi possível limpar o cache. A página será recarregada.',
                variant: 'destructive',
            });
            window.location.reload();
        }
    };

    if (isAuthLoading || !isAuthenticated || !currentUser || currentUser.role !== role) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <p className="text-xl">Carregando...</p>
            </div>
        );
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
                           <SidebarMenuButton asChild isActive={pathname === dashboardPath} onClick={() => setOpenMobile(false)}>
                                <Link href={dashboardPath}>
                                    <LayoutDashboard />
                                    <span>Meu Painel</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="bg-green-600 hover:bg-green-700 text-white font-semibold text-base h-12" onClick={() => setOpenMobile(false)}>
                                <Link href="/solicitar-saldo">
                                    <Coins /> 
                                    <span>Adquirir Saldo</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={handleForceRefresh} variant="outline">
                                 <div>
                                     <RefreshCw /> 
                                     <span>Atualizar Bolão</span>
                                 </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild onClick={() => setOpenMobile(false)}>
                                <Link href="/">
                                    <Home /> <span>Página Inicial</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => { logout(); setOpenMobile(false); }} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                 <div>
                                     <LogOut /> <span>Sair da Conta</span>
                                 </div>
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
                                isSubmitting={isSubmitting}
                                onPurchase={handlePurchaseCart}
                                onRemoveFromCart={(index) => setCart(cart.filter((_, i) => i !== index))}
                            />
                        )}
                    </div>
                </header>
                
                <main className="p-4 md:p-8 flex-1 bg-gradient-to-b from-emerald-700 to-emerald-900 overflow-y-auto">
                   {isDataLoading ? (
                        <div className="text-center p-10 text-white">Carregando dados...</div>
                    ) : children}
                </main>
            </div>

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
