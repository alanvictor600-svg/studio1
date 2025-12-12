
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import type { LotteryConfig, User, Ticket, Draw, SellerHistoryEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot, collection, query, where, orderBy, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useAuth } from './auth-context';
import { useFirebase } from '@/firebase/client-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface DashboardContextType {
    lotteryConfig: LotteryConfig;
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
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
    const { db } = useFirebase();

    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [userTickets, setUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const { toast } = useToast();

    const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [lastVisibleHistory, setLastVisibleHistory] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    
    const listenersRef = useRef<(() => void)[]>([]);

    const clearListeners = useCallback(() => {
        listenersRef.current.forEach(unsub => unsub());
        listenersRef.current = [];
    }, []);
    
    const startDataListeners = useCallback((user: User) => {
        clearListeners();
        setIsDataLoading(true);

        const newListeners: (() => void)[] = [];
        
        const configUnsub = onSnapshot(doc(db, 'configs', 'global'), 
            (configDoc) => {
                const data = configDoc.data();
                if (data) {
                    setLotteryConfig(prev => ({ ...prev, ...data }));
                }
            },
            () => toast({ title: "Erro ao carregar configuração", variant: "destructive" })
        );
        newListeners.push(configUnsub);

        const drawsUnsub = onSnapshot(collection(db, 'draws'), 
            (drawsSnapshot) => setAllDraws(drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw))),
            () => toast({ title: "Erro ao carregar sorteios", variant: "destructive" })
        );
        newListeners.push(drawsUnsub);
        
        const ticketsQuery = query(collection(db, 'tickets'), where('participants', 'array-contains', user.id));

        const ticketsUnsub = onSnapshot(ticketsQuery, 
            (snapshot) => {
                const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
                setUserTickets(ticketsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }, 
            (error) => {
                 const contextualError = new FirestorePermissionError({
                    path: 'tickets',
                    operation: 'list',
                    requestResourceData: { where: [`participants`, 'array-contains', `${user.id}`] }
                });
                errorEmitter.emit('permission-error', contextualError);
                // O toast de erro é emitido globalmente, não precisamos de um aqui.
            }
        );
        newListeners.push(ticketsUnsub);

        const promises = [
            getDocs(doc(db, 'configs', 'global').parent),
            getDocs(collection(db, 'draws')),
            getDocs(ticketsQuery),
        ];

        if (user.role === 'vendedor') {
            setIsLoadingHistory(true);
            const historyQuery = query(collection(db, 'sellerHistory'), where("sellerId", "==", user.id), orderBy('endDate', 'desc'), limit(REPORTS_PER_PAGE));
            const historyPromise = getDocs(historyQuery).then(docSnaps => {
                const historyData = docSnaps.docs.map(d => ({ id: d.id, ...d.data() } as SellerHistoryEntry));
                
                setSellerHistory(historyData);
                setLastVisibleHistory(docSnaps.docs[docSnaps.docs.length - 1] || null);
                setHasMoreHistory(historyData.length === REPORTS_PER_PAGE);
            }).catch(error => {
                const contextualError = new FirestorePermissionError({
                    path: `sellerHistory`,
                    operation: 'list',
                    requestResourceData: { where: [`sellerId`, '==', `${user.id}`] } 
                });
                errorEmitter.emit('permission-error', contextualError);
            }).finally(() => setIsLoadingHistory(false));
            promises.push(historyPromise);
        }

        Promise.all(promises).finally(() => setIsDataLoading(false));

        listenersRef.current = newListeners;
        
        return clearListeners;
    }, [clearListeners, toast, db]);


    const processedTickets = useMemo(() => updateTicketStatusesBasedOnDraws(userTickets, allDraws), [userTickets, allDraws]);
    
    const isLotteryPaused = useMemo(() => {
        return processedTickets.some(t => t.status === 'winning');
    }, [processedTickets]);
    
    const loadMoreHistory = async () => {
        if (!currentUser || !lastVisibleHistory || !hasMoreHistory || !db) return;
        
        setIsLoadingHistory(true);
        const historyQuery = query(collection(db, 'sellerHistory'), where("sellerId", "==", currentUser.id), orderBy('endDate', 'desc'), startAfter(lastVisibleHistory), limit(REPORTS_PER_PAGE));
        try {
            const docSnaps = await getDocs(historyQuery);
            const newHistory = docSnaps.docs.map(d => ({id: d.id, ...d.data()}) as SellerHistoryEntry);
            
            setSellerHistory(prev => [...prev, ...newHistory]);
            setLastVisibleHistory(docSnaps.docs[docSnaps.docs.length - 1] || null);
            setHasMoreHistory(newHistory.length === REPORTS_PER_PAGE);
        } catch (error) {
             const contextualError = new FirestorePermissionError({
                path: `sellerHistory`,
                operation: 'list',
                requestResourceData: { where: [`sellerId`, '==', `${currentUser.id}`], after: lastVisibleHistory.id }
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsLoadingHistory(false);
        }
    }

    const value = {
        lotteryConfig,
        userTickets: processedTickets, 
        allDraws, 
        isLotteryPaused, 
        isDataLoading,
        sellerHistory, 
        isLoadingHistory, 
        loadMoreHistory, 
        hasMoreHistory,
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
