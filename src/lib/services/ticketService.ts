// src/lib/services/ticketService.ts
import { db } from '@/lib/firebase';
import { doc, runTransaction, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Ticket, LotteryConfig, User } from '@/types';

interface CreateSellerTicketParams {
    seller: User;
    lotteryConfig: LotteryConfig;
    ticketPicks: number[];
    buyerName: string;
    buyerPhone?: string;
}

/**
 * Creates a ticket sold by a seller.
 * This function runs a secure transaction on the server to:
 * 1. Check the seller's balance.
 * 2. Deduct the ticket price.
 * 3. Create the new ticket document.
 * @returns The newly created Ticket object.
 */
export const createSellerTicket = async ({
    seller,
    lotteryConfig,
    ticketPicks,
    buyerName,
    buyerPhone,
}: CreateSellerTicketParams): Promise<{ createdTicket: Ticket, newBalance: number }> => {
    
    if (!seller || !seller.id) {
        throw new Error("Vendedor não autenticado.");
    }
    if (ticketPicks.length !== 10) {
        throw new Error("O bilhete deve conter 10 números.");
    }
    if (!buyerName) {
        throw new Error("O nome do comprador é obrigatório.");
    }

    const ticketPrice = lotteryConfig.ticketPrice;
    const userRef = doc(db, "users", seller.id);
    let createdTicket: Ticket | null = null;
    let newBalance = 0;


    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("Usuário do vendedor não encontrado.");
        }

        const currentBalance = userDoc.data().saldo || 0;
        if (currentBalance < ticketPrice) {
            // This specific error message is caught by the client to show a dialog
            throw new Error("Saldo insuficiente.");
        }
        
        newBalance = currentBalance - ticketPrice;
        transaction.update(userRef, { saldo: newBalance });
        
        const newTicketRef = doc(collection(db, "tickets"));
        
        const participants: string[] = [seller.id];

        const newTicketData: Omit<Ticket, 'buyerPhone'> & { buyerPhone?: string } = {
          id: newTicketRef.id,
          numbers: [...ticketPicks].sort((a,b) => a-b),
          status: 'active',
          createdAt: new Date().toISOString(),
          buyerName: buyerName,
          sellerId: seller.id,
          sellerUsername: seller.username,
          participants: participants,
        };

        if (buyerPhone) {
            newTicketData.buyerPhone = buyerPhone;
        }

        transaction.set(newTicketRef, newTicketData);
        
        createdTicket = newTicketData as Ticket;
    });

    if (!createdTicket) {
        throw new Error("Falha ao criar o bilhete na transação.");
    }

    return { createdTicket, newBalance };
};


interface CreateClientTicketsParams {
    user: User;
    cart: number[][];
    lotteryConfig: LotteryConfig;
}

export const createClientTickets = async ({ user, cart, lotteryConfig }: CreateClientTicketsParams): Promise<{ createdTickets: Ticket[], newBalance: number }> => {
    const totalCost = cart.length * lotteryConfig.ticketPrice;
    const userRef = doc(db, "users", user.id);
    const createdTickets: Ticket[] = [];
    let newBalance = 0;

    await runTransaction(db, async (transaction) => {
        const freshUserDoc = await transaction.get(userRef);
        if (!freshUserDoc.exists()) throw new Error("Usuário não encontrado.");
        
        const currentBalance = freshUserDoc.data().saldo || 0;
        if (currentBalance < totalCost) {
            throw new Error("Saldo insuficiente.");
        }

        newBalance = currentBalance - totalCost;
        transaction.update(userRef, { saldo: newBalance });

        // Create tickets within the same transaction
        cart.forEach(ticketNumbers => {
            const newTicketRef = doc(collection(db, "tickets"));
            const participants : string[] = [user.id];
            const newTicketData: Ticket = {
                id: newTicketRef.id,
                numbers: ticketNumbers.sort((a, b) => a - b),
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                buyerName: user.username,
                buyerId: user.id,
                participants: participants,
            };
            transaction.set(newTicketRef, newTicketData);
            createdTickets.push(newTicketData);
        });
    });

    return { createdTickets, newBalance };
};

    
