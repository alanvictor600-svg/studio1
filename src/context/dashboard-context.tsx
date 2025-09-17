
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import type { LotteryConfig, User, Ticket } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, writeBatch, runTransaction, collection, getDoc } from 'firebase/firestore';

interface DashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    lotteryConfig: LotteryConfig;
    setLotteryConfig: Dispatch<SetStateAction<LotteryConfig>>;
    handlePurchaseCart: () => Promise<void>;
    isCreditsDialogOpen: boolean;
    setIsCreditsDialogOpen: Dispatch<SetStateAction<boolean>>;
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
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
        const totalCost = cart.length * lotteryConfig.ticketPrice;
        const userRef = doc(db, "users", currentUser.id);

        try {
            const createdTickets: Ticket[] = [];
            
            await runTransaction(db, async (transaction) => {
                const freshUserDoc = await transaction.get(userRef);
                if (!freshUserDoc.exists()) throw new Error("Usuário não encontrado.");
                
                const currentBalance = freshUserDoc.data().saldo || 0;
                if (currentBalance < totalCost) {
                    // This specific error message will be caught to trigger the dialog
                    throw new Error("Saldo insuficiente.");
                }

                const newBalance = currentBalance - totalCost;
                transaction.update(userRef, { saldo: newBalance });

                // Create tickets within the same transaction
                cart.forEach(ticketNumbers => {
                    const newTicketRef = doc(collection(db, "tickets"));
                    const newTicketData: Ticket = {
                        id: newTicketRef.id,
                        numbers: ticketNumbers.sort((a, b) => a - b),
                        status: 'active' as const,
                        createdAt: new Date().toISOString(),
                        buyerName: currentUser.username,
                        buyerId: currentUser.id,
                    };
                    transaction.set(newTicketRef, newTicketData);
                    createdTickets.push(newTicketData);
                });
            });

            // If transaction is successful, update local state
            updateCurrentUserCredits((currentUser.saldo || 0) - totalCost);
            setCart([]);
            setReceiptTickets(createdTickets); // Set tickets for receipt dialog

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            if (e.message === "Saldo insuficiente.") {
                setIsCreditsDialogOpen(true);
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
        receiptTickets,
        setReceiptTickets,
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
