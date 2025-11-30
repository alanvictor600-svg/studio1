"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import type { LotteryConfig, User, Ticket, Draw, SellerHistoryEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createClientTicketsAction } from '@/app/actions/ticket';
import { doc, onSnapshot, collection, query, where, orderBy, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase-client';
import { v4 as uuidv4 } from 'uuid';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useAuth } from './auth-context';

interface DashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    handlePurchaseCart: () => Promise<void>;
    isSubmitting: boolean;
    lotteryConfig: LotteryConfig;
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
    showCreditsDialog: (show: boolean) => void;
    handleGenerateReceipt: (ticket: Ticket) => void;
    sellerHistory: SellerHistoryEntry[];
    isLoadingHistory: boolean;
    loadMoreHistory: () => void;
    hasMoreHistory: boolean;
    startDataListeners: (user: User) => () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
  configVersion: 1
};

const REPORTS_PER_PAGE = 9;

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [rawUserTickets, setRawUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const { toast } = useToast();

    const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [lastVisibleHistory, setLastVisibleHistory] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    
    const activeUserRef = useRef<User | null>(null);
    const listenersRef = useRef<(() => void)[]>([]);

    const clearListeners = () => {
        listenersRef.current.forEach(unsub => unsub());
        listenersRef.current = [];
    };
    
    const startDataListeners = useCallback((user: User) => {
        if (activeUserRef.current?.id === user.id && !isDataLoading) {
            return () => {};
        }

        clearListeners();
        activeUserRef.current = user;
        setIsDataLoading(true);

        const newListeners: (() => void)[] = [];
        let allListenersReady = 0;
        const totalListeners = user.role === 'vendedor' ? 4 : 3;

        const checkAllDataLoaded = () => {
            allListenersReady++;
            if (allListenersReady === totalListeners) {
                setIsDataLoading(false);
            }
        };

        try {
            const configUnsub = onSnapshot(doc(db, 'configs', 'global'), (configDoc) => {
                setLotteryConfig(prev => ({ ...prev, ...configDoc.data() }));
                checkAllDataLoaded();
            }, () => checkAllDataLoaded());

            const drawsUnsub = onSnapshot(collection(db, 'draws'), (drawsSnapshot) => {
                setAllDraws(drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw)));
                checkAllDataLoaded();
            }, () => checkAllDataLoaded());
            
            const idField = user.role === 'cliente' ? 'buyerId' : 'sellerId';
            const ticketsQuery = query(collection(db, 'tickets'), where(idField, '==', user.id));
            const ticketsUnsub = onSnapshot(ticketsQuery, (ticketSnapshot) => {
                setRawUserTickets(ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                checkAllDataLoaded();
            }, () => checkAllDataLoaded());

            newListeners.push(configUnsub, drawsUnsub, ticketsUnsub);

            if (user.role === 'vendedor') {
                setIsLoadingHistory(true);
                const historyQuery = query(collection(db, 'sellerHistory'), where("sellerId", "==", user.id), orderBy("endDate", "desc"), limit(REPORTS_PER_PAGE));
                const historyUnsub = onSnapshot(historyQuery, (docSnaps) => {
                    const historyData = docSnaps.docs.map(d => ({ id: d.id, ...d.data() } as SellerHistoryEntry));
                    setSellerHistory(historyData);
                    setLastVisibleHistory(docSnaps.docs[docSnaps.docs.length - 1] || null);
                    setHasMoreHistory(historyData.length === REPORTS_PER_PAGE);
                    setIsLoadingHistory(false);
                    checkAllDataLoaded();
                }, () => {
                    setIsLoadingHistory(false);
                    checkAllDataLoaded();
                });
                newListeners.push(historyUnsub);
            }

        } catch (error) {
            console.error("Error setting up Firestore listeners:", error);
            setIsDataLoading(false);
        }

        listenersRef.current = newListeners;

        return clearListeners;
    }, [isDataLoading]);

    const userTickets = useMemo(() => updateTicketStatusesBasedOnDraws(rawUserTickets, allDraws), [rawUserTickets, allDraws]);
    
    const isLotteryPaused = useMemo(() => {
        return userTickets.some(t => t.status === 'winning');
    }, [userTickets]);
    
    const showCreditsDialog = useCallback((show: boolean) => setIsCreditsDialogOpen(show), []);
    const handleGenerateReceipt = useCallback((ticket: Ticket) => setReceiptTickets([ticket]), []);

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
            await createClientTicketsAction({ user: { id: currentUser.id, username: currentUser.username }, cart });

            const ticketsForReceipt: Ticket[] = cart.map(numbers => ({
                id: uuidv4(),
                numbers,
                status: 'active',
                createdAt: new Date().toISOString(),
                buyerName: currentUser.username,
                buyerId: currentUser.id,
            }));

            setCart([]);
            setReceiptTickets(ticketsForReceipt);
            toast({
              title: "Compra Realizada!",
              description: `Sua compra de ${ticketsForReceipt.length} bilhete(s) foi um sucesso.`,
              className: "bg-primary text-primary-foreground",
              duration: 4000
            });
        } catch (e: any) {
            if (e.message.includes("Saldo insuficiente")) {
                showCreditsDialog(true);
            } else {
                toast({ title: "Erro na Compra", description: e.message || "Não foi possível registrar seus bilhetes.", variant: "destructive" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const loadMoreHistory = async () => {
        if (!currentUser || !lastVisibleHistory) return;
        
        setIsLoadingHistory(true);
        const historyQuery = query(collection(db, 'sellerHistory'), where("sellerId", "==", currentUser.uid), orderBy("endDate", "desc"), startAfter(lastVisibleHistory), limit(REPORTS_PER_PAGE));
        const docSnaps = await getDocs(historyQuery);
        const newHistory = docSnaps.docs.map(d => ({id: d.id, ...d.data()}) as SellerHistoryEntry);
        
        setSellerHistory(prev => [...prev, ...newHistory]);
        setLastVisibleHistory(docSnaps.docs[docSnaps.docs.length - 1] || null);
        setHasMoreHistory(newHistory.length === REPORTS_PER_PAGE);
        setIsLoadingHistory(false);
    }

    const value = {
        cart, setCart, handlePurchaseCart,
        isSubmitting, lotteryConfig, receiptTickets, setReceiptTickets,
        userTickets, allDraws, isLotteryPaused, isDataLoading,
        showCreditsDialog, handleGenerateReceipt,
        sellerHistory, isLoadingHistory, loadMoreHistory, hasMoreHistory,
        startDataListeners
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
