'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Ticket, LotteryConfig } from '@/types';

// Ação para criar um bilhete vendido por um vendedor
interface CreateSellerTicketParams {
    sellerId: string;
    sellerUsername: string;
    lotteryConfig: LotteryConfig;
    ticketPicks: number[];
    buyerName: string;
    buyerPhone?: string;
}

export const createSellerTicketAction = async ({
    sellerId,
    sellerUsername,
    lotteryConfig,
    ticketPicks,
    buyerName,
    buyerPhone,
}: CreateSellerTicketParams): Promise<{ createdTicket: Ticket, newBalance: number }> => {
    if (!sellerId) throw new Error("Vendedor não autenticado.");
    if (ticketPicks.length !== 10) throw new Error("O bilhete deve conter 10 números.");
    if (!buyerName) throw new Error("O nome do comprador é obrigatório.");

    const ticketPrice = lotteryConfig.ticketPrice;
    const userRef = adminDb.collection("users").doc(sellerId);
    
    let createdTicket: Ticket | null = null;
    let newBalance = 0;

    await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Usuário do vendedor não encontrado.");
        
        const currentBalance = userDoc.data()?.saldo || 0;
        if (currentBalance < ticketPrice) throw new Error("Saldo insuficiente.");

        newBalance = currentBalance - ticketPrice;
        transaction.update(userRef, { saldo: newBalance });
        
        const newTicketRef = adminDb.collection("tickets").doc();
        const newTicketData: Omit<Ticket, 'id'> = {
            numbers: [...ticketPicks].sort((a,b) => a-b),
            status: 'active',
            createdAt: new Date().toISOString(),
            buyerName: buyerName.trim(),
            buyerPhone: buyerPhone?.trim() || undefined,
            sellerId: sellerId,
            sellerUsername: sellerUsername,
        };
        transaction.set(newTicketRef, newTicketData);
        createdTicket = { ...newTicketData, id: newTicketRef.id };
    });

    if (!createdTicket) throw new Error("Falha ao criar o bilhete na transação.");

    return { createdTicket, newBalance };
};

// Ação para criar bilhetes comprados por um cliente
interface CreateClientTicketsParams {
    user: { id: string; username: string };
    cart: number[][];
    lotteryConfig: LotteryConfig;
}

export const createClientTicketsAction = async ({ user, cart, lotteryConfig }: CreateClientTicketsParams): Promise<{ createdTickets: Ticket[], newBalance: number }> => {
    const totalCost = cart.length * lotteryConfig.ticketPrice;
    const userRef = adminDb.collection("users").doc(user.id);
    const createdTickets: Ticket[] = [];
    let newBalance = 0;

    await adminDb.runTransaction(async (transaction) => {
        const freshUserDoc = await transaction.get(userRef);
        if (!freshUserDoc.exists()) throw new Error("Usuário não encontrado.");
        
        const currentBalance = freshUserDoc.data()?.saldo || 0;
        if (currentBalance < totalCost) throw new Error("Saldo insuficiente.");

        newBalance = currentBalance - totalCost;
        transaction.update(userRef, { saldo: newBalance });

        for (const ticketNumbers of cart) {
            const newTicketRef = adminDb.collection("tickets").doc();
            const newTicketData: Omit<Ticket, 'id'> = {
                numbers: ticketNumbers.sort((a, b) => a - b),
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                buyerName: user.username,
                buyerId: user.id,
            };
            transaction.set(newTicketRef, newTicketData);
            createdTickets.push({ ...newTicketData, id: newTicketRef.id });
        }
    });

    return { createdTickets, newBalance };
};
