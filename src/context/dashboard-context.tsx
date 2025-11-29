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
    handleGenerateReceipt: (ticket: Ticket) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
  configVersion: 1
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const { currentUser, isAuthenticated } = useAuth();
    const { toast } = useToast();

    const [userTickets, setUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isLotteryPaused, setIsLotteryPaused] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    const listenersRef = useRef<Unsubscribe[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            setUserTickets([]);
            setAllDraws([]);
            setCart([]);
            setIsDataLoading(true);
             listenersRef.current.forEach(unsub => unsub());
             listenersRef.current = [];
        }
    }, [isAuthenticated]);

    const showCreditsDialog = useCallback(() => {
        setIsCreditsDialogOpen(true);
    }, []);

    const handleGenerateReceipt = useCallback((ticket: Ticket) => {
        setReceiptTickets([ticket]);
    }, []);

    useEffect(() => {
        const drawsExist = allDraws.length > 0;
        setIsLotteryPaused(drawsExist);
    }, [allDraws]);


    const startDataListeners = useCallback((user: User): () => void => {
        if (listenersRef.current.length > 0) {
           return () => {};
        }

        setIsDataLoading(true);
        let loadedCount = 0;
        const totalListeners = 3;

        const checkAllDataLoaded = () => {
            loadedCount++;
            if (loadedCount === totalListeners) {
                setIsDataLoading(false);
            }
        };

        const configDocRef = doc(db, 'configs', 'global');
        const configUnsub = onSnapshot(configDocRef, (configDoc) => {
            if (configDoc.exists()) {
                const data = configDoc.data() as LotteryConfig;
                setLotteryConfig({
                    ticketPrice: data.ticketPrice || 2,
                    sellerCommissionPercentage: data.sellerCommissionPercentage || 10,
                    ownerCommissionPercentage: data.ownerCommissionPercentage || 5,
                    clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || 10,
                    configVersion: data.configVersion || 1,
                });
            } else {
                 setLotteryConfig(DEFAULT_LOTTERY_CONFIG);
            }
            checkAllDataLoaded();
        }, (error) => {
            console.error("Error fetching lottery config: ", error);
            checkAllDataLoaded();
        });

        const drawsQuery = query(collection(db, 'draws'));
        const drawsUnsub = onSnapshot(drawsQuery, (drawsSnapshot) => {
            const drawsData = drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw));
            setAllDraws(drawsData);
            checkAllDataLoaded();
        }, (error) => {
            console.error("Error fetching draws: ", error);
            checkAllDataLoaded();
        });

        const ticketsCollectionRef = collection(db, 'tickets');
        let ticketsQuery: Query | null = null;
        
        if (user.role === 'cliente') {
            ticketsQuery = query(ticketsCollectionRef, where('buyerId', '==', user.id));
        } else if (user.role === 'vendedor') {
            ticketsQuery = query(ticketsCollectionRef, where('sellerId', '==', user.id));
        }
        
        let ticketsUnsub: Unsubscribe | null = null;
        if (ticketsQuery) {
            ticketsUnsub = onSnapshot(ticketsQuery, (ticketSnapshot) => {
                const userTicketsData = ticketSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as Ticket))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setUserTickets(userTicketsData);
                checkAllDataLoaded();
            }, (error) => {
                console.error("Error fetching user tickets: ", error);
                checkAllDataLoaded();
            });
        } else {
            setUserTickets([]);
            checkAllDataLoaded();
        }

        const allUnsubscribes = [configUnsub, drawsUnsub, ticketsUnsub].filter(Boolean) as Unsubscribe[];
        listenersRef.current = allUnsubscribes;

        return () => {
            allUnsubscribes.forEach(unsub => unsub());
            listenersRef.current = [];
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
            await createClientTicketsAction({
                user: { id: currentUser.id, username: currentUser.username },
                cart,
            });

            const ticketsForReceipt: Ticket[] = cart.map(ticketNumbers => ({
                id: uuidv4(),
                numbers: ticketNumbers,
                status: 'active',
                createdAt: new Date().toISOString(),
                buyerName: currentUser.username,
                buyerId: currentUser.id,
            }));

            setCart([]);
            setReceiptTickets(ticketsForReceipt);
            
            toast({
              title: "Compra Realizada!",
              description: `Sua compra de ${ticketsForReceipt.length} bilhete(s) foi um sucesso. Seu saldo será atualizado em breve.`,
              className: "bg-primary text-primary-foreground",
              duration: 4000
            });

        } catch (e: any) {
            if (e.message.includes("Saldo insuficiente")) {
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
        handleGenerateReceipt,
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
