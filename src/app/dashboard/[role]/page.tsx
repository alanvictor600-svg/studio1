
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import type { Ticket } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingCart, PauseCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { SellerDashboard } from '@/components/seller-dashboard';
import DashboardLoading from '../loading';
import { createClientTicketsAction } from '@/app/actions/ticket';
import { TicketReceiptDialog } from '@/components/ticket-receipt-dialog';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog';
import { ShoppingCart as ShoppingCartComponent } from '@/components/shopping-cart';
import { createPortal } from 'react-dom';


export default function DashboardPage() {
    const params = useParams();
    const { role } = params as { role: 'cliente' | 'vendedor' };
    const { isDataLoading } = useDashboard();

    if (isDataLoading) {
        return <DashboardLoading />;
    }
    
    if (role === 'cliente') {
        return <ClientePageContent />;
    }
    
    if (role === 'vendedor') {
        return <VendedorPageContent />;
    }

    return <p>Painel desconhecido. Verifique o URL.</p>;
}

function ClientePageContent() {
    const { currentUser, updateUserBalance } = useAuth();
    const { userTickets, allDraws, isLotteryPaused, lotteryConfig } = useDashboard();
    const { toast } = useToast();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('aposta');
    const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);
    
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [cartPortalTarget, setCartPortalTarget] = useState<Element | null>(null);
    const [dialogPortalTarget, setDialogPortalTarget] = useState<Element | null>(null);


    useEffect(() => {
        // This ensures the code only runs on the client, where document is available.
        setCartPortalTarget(document.querySelector('[data-slot="shopping-cart-container"]'));
        setDialogPortalTarget(document.getElementById('dialog-portal-root'));
    }, []);
    

    const handlePurchaseCart = async () => {
        if (!currentUser) {
            toast({ title: "Usuário não encontrado", variant: "destructive" });
            return;
        }
        if (cart.length === 0) {
            toast({ title: "Carrinho Vazio", variant: "destructive" });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const result = await createClientTicketsAction({ user: { id: currentUser.id, username: currentUser.username }, cart });

            if (result.success && result.createdTickets) {
                toast({
                  title: "Compra Realizada!",
                  description: `Sua compra de ${result.createdTickets.length} bilhete(s) foi um sucesso.`,
                  className: "bg-primary text-primary-foreground",
                  duration: 4000
                });
                setCart([]);
                // These two state updates need to happen without one causing the other to be cancelled
                if (typeof result.newBalance === 'number') {
                    updateUserBalance(result.newBalance);
                }
                setReceiptTickets(result.createdTickets);
            } else if (result.error === 'INSUFFICIENT_FUNDS') {
                setIsCreditsDialogOpen(true);
            } else {
                toast({ title: "Erro na Compra", description: result?.error || "Não foi possível registrar seus bilhetes.", variant: "destructive" });
            }
        } catch (e: any) {
            console.error("Failed to purchase cart:", e);
            toast({ title: "Erro na Compra", description: "Ocorreu um erro inesperado no servidor.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveFromCart = (indexToRemove: number) => {
        setCart(currentCart => currentCart.filter((_, index) => index !== indexToRemove));
        toast({
            title: "Bilhete removido",
            description: "O bilhete foi removido do seu carrinho.",
            duration: 2000
        });
    };


    useEffect(() => {
        if (ticketToRebet) {
            setCart(prevCart => [...prevCart, ticketToRebet]);
            setTicketToRebet(null); 
            setActiveTab('aposta'); 
            toast({
                title: "Bilhete adicionado ao carrinho!",
                description: "A aposta selecionada está pronta para ser comprada novamente no carrinho.",
                duration: 4000
            });
        }
    }, [ticketToRebet, toast, setCart]);
  
    const handleRebet = (numbers: number[]) => {
        setTicketToRebet(numbers);
    };

    const handleGenerateReceipt = (ticket: Ticket) => {
        setReceiptTickets([ticket]);
    };

    const TABS_CONFIG = [
        { value: 'aposta', label: 'Fazer Aposta', Icon: TicketIcon },
        { value: 'bilhetes', label: 'Meus Bilhetes', Icon: ShoppingCart },
    ];

    return (
        <div className="flex flex-col h-full space-y-8">
            {cartPortalTarget && createPortal(
                <ShoppingCartComponent
                    cart={cart}
                    currentUser={currentUser}
                    lotteryConfig={lotteryConfig}
                    onPurchase={handlePurchaseCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    isSubmitting={isSubmitting}
                />,
                cartPortalTarget
            )}

            <header className="flex-shrink-0">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-500 text-transparent bg-clip-text">
                    Bem-vindo, Apostador!
                </h1>
                <p className="text-lg text-white/80 mt-2 text-center">
                    Sua sorte começa aqui. Escolha seus números e boa sorte!
                </p>
            </header>
      
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col">
                <TabsList className={`grid w-full grid-cols-2 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md flex-shrink-0`}>
                    {TABS_CONFIG.map(tab => (
                        <TabsTrigger 
                            key={tab.value} 
                            value={tab.value} 
                            className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                        >
                            <tab.Icon className="mr-2 h-5 w-5" /> {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
          
                <TabsContent value="aposta" className="flex-grow flex flex-col">
                    {isLotteryPaused ? (
                        <div className="flex items-center justify-center flex-1">
                            <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground max-w-lg">
                                <PauseCircle className="h-5 w-5 text-primary" />
                                <AlertTitle className="text-primary font-bold">Apostas Pausadas</AlertTitle>
                                <AlertDescription className="text-muted-foreground">
                                O registro de novas apostas está suspenso.
                                Aguarde o administrador iniciar um novo ciclo para continuar apostando.
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <TicketSelectionForm 
                            cart={cart}
                            onCartChange={setCart}
                        />
                    )}
                </TabsContent>
          
                <TabsContent value="bilhetes" className="flex-grow">
                    <TicketList
                        tickets={userTickets}
                        draws={allDraws}
                        onRebet={handleRebet}
                        onGenerateReceipt={handleGenerateReceipt}
                    />
                </TabsContent>
            </Tabs>
             <InsufficientCreditsDialog
                isOpen={isCreditsDialogOpen}
                onOpenChange={setIsCreditsDialogOpen}
            />
            {dialogPortalTarget && receiptTickets && createPortal(
                <TicketReceiptDialog
                    isOpen={!!receiptTickets}
                    onOpenChange={(isOpen) => { if (!isOpen) setReceiptTickets(null); }}
                    tickets={receiptTickets}
                    lotteryConfig={lotteryConfig}
                />,
                dialogPortalTarget
            )}
        </div>
    );
}


function VendedorPageContent() {
    const { userTickets, allDraws, isLotteryPaused } = useDashboard();
    
    return (
        <div className="flex flex-col h-full space-y-8">
            <header>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-cyan-400 via-teal-500 to-cyan-600 text-transparent bg-clip-text">
                    Painel do Vendedor
                </h1>
                <p className="text-lg text-white/80 mt-2 text-center">
                    Gerencie suas vendas, acompanhe seus resultados e ganhe comissões.
                </p>
            </header>
            
            <SellerDashboard
                isLotteryPaused={isLotteryPaused}
                userTickets={userTickets}
                allDraws={allDraws}
            />
        </div>
    );
}
