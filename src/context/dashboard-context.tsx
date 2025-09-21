

"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useRef, useEffect } from 'react';
import type { LotteryConfig, User, Ticket, Draw } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createClientTickets } from '@/lib/services/ticketService';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    lotteryConfig: LotteryConfig;
    setLotteryConfig: Dispatch<SetStateAction<LotteryConfig>>;
    handlePurchaseCart: () => Promise<void>;
    
    // Dialog control
    isCreditsDialogOpen: boolean;
    showCreditsDialog: () => void;
    setIsCreditsDialogOpen: Dispatch<SetStateAction<boolean>>;
    
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
    
    // New properties for centralized data
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
    startDataListeners: (user: User) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const { currentUser, updateCurrentUserCredits } = useAuth();
    const { toast } = useToast();

    // New state for centralized data
    const [userTickets, setUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isLotteryPaused, setIsLotteryPaused] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    // To prevent setting up multiple listeners
    const listenersActive = useRef(false);

    const showCreditsDialog = useCallback(() => {
        setIsCreditsDialogOpen(true);
    }, []);

    const startDataListeners = useCallback((user: User) => {
        if (listenersActive.current) return;
        listenersActive.current = true;
        setIsDataLoading(true);

        const unsubscribes: (() => void)[] = [];

        // 1. Config Listener
        const configDocRef = doc(db, 'configs', 'global');
        unsubscribes.push(onSnapshot(configDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setLotteryConfig({
                    ticketPrice: data.ticketPrice || 2,
                    sellerCommissionPercentage: data.sellerCommissionPercentage || 10,
                    ownerCommissionPercentage: data.ownerCommissionPercentage || 5,
                    clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || 10,
                });
            }
        }, (error) => {
            console.error("Error fetching lottery config: ", error);
            toast({ title: "Erro de Configuração", description: "Não foi possível carregar as configurações da loteria.", variant: "destructive" });
        }));

        // 2. Draws Listener
        const drawsQuery = query(collection(db, 'draws'));
        unsubscribes.push(onSnapshot(drawsQuery, (drawsSnapshot) => {
            const drawsData = drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw));
            setAllDraws(drawsData);
            setIsLotteryPaused(drawsData.length > 0);
        }, (error) => {
            console.error("Error fetching draws: ", error);
            toast({ title: "Erro de Sorteios", description: "Não foi possível carregar os sorteios.", variant: "destructive" });
        }));

        // 3. User Tickets Listener
        const idField = user.role === 'cliente' ? 'buyerId' : 'sellerId';
        const ticketsQuery = query(
            collection(db, 'tickets'),
            where(idField, '==', user.id),
        );
        unsubscribes.push(onSnapshot(ticketsQuery, (ticketSnapshot) => {
            const userTicketsData = ticketSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Ticket))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setUserTickets(userTicketsData);
            setIsDataLoading(false); // Consider loading finished after tickets arrive
        }, (error) => {
            console.error("Error fetching user tickets: ", error);
            toast({ title: "Erro ao Carregar Bilhetes", description: "Não foi possível carregar seus bilhetes.", variant: "destructive" });
            setIsDataLoading(false);
        }));

        // Return a cleanup function that calls all unsubscribes
        return () => {
            unsubscribes.forEach(unsub => unsub());
            listenersActive.current = false;
        };
    }, [toast]);

    // This effect ensures listeners are cleaned up if the component unmounts
     useEffect(() => {
        return () => {
            // This is a safety net. The actual cleanup function is returned by startDataListeners,
            // but if the provider itself unmounts, we should clear the flag.
            listenersActive.current = false;
        };
    }, []);

    const handlePurchaseCart = async () => {
        if (!currentUser) {
            toast({ title: "Erro", description: "Você precisa estar logado para comprar.", variant: "destructive" });
            return;
        }
        if (cart.length === 0) {
            toast({ title: "Carrinho Vazio", description: "Adicione pelo menos um bilhete ao carrinho para comprar.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const { createdTickets, newBalance } = await createClientTickets({
                user: currentUser,
                cart,
                lotteryConfig
            });

            updateCurrentUserCredits(newBalance);
            setCart([]);
            setReceiptTickets(createdTickets);

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            if (e.message === "Insufficient credits.") {
                showCreditsDialog();
            } else {
                toast({ title: "Erro na Compra", description: e.message || "Não foi possível registrar seus bilhetes.", variant: "destructive" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const value = {
        cart,
        setCart,
        isSubmitting,
        setIsSubmitting,
        lotteryConfig,
        setLotteryConfig,
        handlePurchaseCart,
        isCreditsDialogOpen,
        setIsCreditsDialogOpen,
        showCreditsDialog,
        receiptTickets,
        setReceiptTickets,
        // Pass new data and functions
        userTickets,
        allDraws,
        isLotteryPaused,
        isDataLoading,
        startDataListeners,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = (): DashboardContextType => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
