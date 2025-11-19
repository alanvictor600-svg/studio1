
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useRef, useEffect } from 'react';
import type { LotteryConfig, User, Ticket, Draw } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createClientTicketsAction } from '@/app/actions/ticket';
import { doc, onSnapshot, collection, query, where, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { v4 as uuidv4 } from 'uuid';

interface PublicRankingEntry {
  initials: string;
  matches: number;
  ticketId: string;
}

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
    startDataListeners: (user: User) => () => void; // Now returns a cleanup function
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
    const { currentUser, isAuthenticated, updateCurrentUserCredits } = useAuth();
    const { toast } = useToast();

    // New state for centralized data
    const [userTickets, setUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isLotteryPaused, setIsLotteryPaused] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    // To prevent setting up multiple listeners
    const listenersActive = useRef(false);

    // This effect handles cleaning up state when the user logs out.
    useEffect(() => {
        if (!isAuthenticated) {
            setUserTickets([]);
            setAllDraws([]);
            setCart([]);
            setIsDataLoading(true);
            listenersActive.current = false;
        }
    }, [isAuthenticated]);

    const showCreditsDialog = useCallback(() => {
        setIsCreditsDialogOpen(true);
    }, []);

    // This effect will run whenever draws or tickets change to re-evaluate the lottery pause state.
    useEffect(() => {
        // A lottery is considered "paused" for new entries if any draws have been made in the current cycle.
        const drawsExist = allDraws.length > 0;
        setIsLotteryPaused(drawsExist);
    }, [allDraws]);


    const startDataListeners = useCallback((user: User): () => void => {
        if (listenersActive.current || !user) {
            return () => {};
        }
        listenersActive.current = true;
        setIsDataLoading(true);

        const unsubscribes: Unsubscribe[] = [];
        let configLoaded = false;
        let ticketsLoaded = false;
        let drawsLoaded = false;

        const checkAllDataLoaded = () => {
            if(configLoaded && ticketsLoaded && drawsLoaded) {
                setIsDataLoading(false);
            }
        }

        // 1. Config Listener
        const configDocRef = doc(db, 'configs', 'global');
        unsubscribes.push(onSnapshot(configDocRef, (configDoc) => {
            if (configDoc.exists()) {
                const data = configDoc.data();
                setLotteryConfig({
                    ticketPrice: data.ticketPrice || 2,
                    sellerCommissionPercentage: data.sellerCommissionPercentage || 10,
                    ownerCommissionPercentage: data.ownerCommissionPercentage || 5,
                    clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || 10,
                });
            } else {
                 setLotteryConfig(DEFAULT_LOTTERY_CONFIG);
            }
            configLoaded = true;
            checkAllDataLoaded();
        }, (error) => {
            console.error("Error fetching lottery config: ", error);
            configLoaded = true;
            checkAllDataLoaded();
        }));

        // 2. Draws Listener
        const drawsQuery = query(collection(db, 'draws'));
        unsubscribes.push(onSnapshot(drawsQuery, (drawsSnapshot) => {
            const drawsData = drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw));
            setAllDraws(drawsData);
            drawsLoaded = true;
            checkAllDataLoaded();
        }, (error) => {
            console.error("Error fetching draws: ", error);
            drawsLoaded = true;
            checkAllDataLoaded();
        }));

        // 3. User Tickets Listener
        const ticketsCollectionRef = collection(db, 'tickets');
        let ticketsQuery;
        
        if (user.role === 'cliente') {
            ticketsQuery = query(ticketsCollectionRef, where('buyerId', '==', user.id));
        } else if (user.role === 'vendedor') {
            ticketsQuery = query(ticketsCollectionRef, where('sellerId', '==', user.id));
        } else {
            ticketsQuery = null; // No query for other roles like admin on this dashboard
        }
        
        if (ticketsQuery) {
            unsubscribes.push(onSnapshot(ticketsQuery, (ticketSnapshot) => {
                const userTicketsData = ticketSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as Ticket))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setUserTickets(userTicketsData);
                ticketsLoaded = true;
                checkAllDataLoaded();
            }, (error) => {
                console.error("Error fetching user tickets: ", error);
                ticketsLoaded = true;
                checkAllDataLoaded();
            }));
        } else {
            setUserTickets([]);
            ticketsLoaded = true;
            checkAllDataLoaded();
        }

        // Return a cleanup function that calls all unsubscribes
        return () => {
            unsubscribes.forEach(unsub => unsub());
            listenersActive.current = false;
        };
    }, []); // This useCallback has no dependencies as it's a setup function

     useEffect(() => {
        // Ensure listeners are always cleaned up on component unmount
        return () => {
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
        if (isDataLoading) {
            toast({ title: "Aguarde", description: "Os dados da loteria ainda estão carregando. Tente novamente em um instante.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const { newBalance } = await createClientTicketsAction({
                user: { id: currentUser.id, username: currentUser.username },
                cart,
            });

            // Optimistically generate tickets for the receipt before clearing cart
            const ticketsForReceipt: Ticket[] = cart.map(ticketNumbers => ({
                id: uuidv4(), // Generate a temp ID, the real one is in the DB
                numbers: ticketNumbers,
                status: 'active',
                createdAt: new Date().toISOString(),
                buyerName: currentUser.username,
                buyerId: currentUser.id,
            }));

            updateCurrentUserCredits(newBalance);
            setCart([]);
            setReceiptTickets(ticketsForReceipt);
            
            toast({
              title: "Compra Realizada!",
              description: `Sua compra de ${ticketsForReceipt.length} bilhete(s) foi um sucesso.`,
              className: "bg-primary text-primary-foreground",
              duration: 4000
            });

        } catch (e: any) {
            if (e.message === "Saldo insuficiente.") {
                showCreditsDialog();
            } else {
                console.error("Transaction failed: ", e);
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
