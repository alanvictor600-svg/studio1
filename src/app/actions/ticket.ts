
'use server';

import type { Ticket, LotteryConfig, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { adminDb } from '@/lib/firebase-admin-config';

// Ação para criar um bilhete vendido por um vendedor
interface CreateSellerTicketParams {
    sellerId: string;
    sellerUsername: string;
    ticketPicks: number[];
    buyerName: string;
    buyerPhone?: string;
}

export const createSellerTicketAction = async ({
    sellerId,
    sellerUsername,
    ticketPicks,
    buyerName,
    buyerPhone,
}: CreateSellerTicketParams): Promise<{ createdTicket?: Ticket, success: boolean, error?: string, newBalance?: number }> => {
    if (!sellerId) return { success: false, error: "Vendedor não autenticado." };
    if (ticketPicks.length !== 10) return { success: false, error: "O bilhete deve conter 10 números." };
    if (!buyerName) return { success: false, error: "O nome do comprador é obrigatório." };

    const userRef = adminDb.collection("users").doc(sellerId);
    const configRef = adminDb.collection('configs').doc('global');

    try {
        const { createdTicket, newBalance } = await adminDb.runTransaction(async (transaction) => {
            const configDoc = await transaction.get(configRef);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error("Usuário do vendedor não encontrado.");
            }
            
            const lotteryConfig = (configDoc.data() as LotteryConfig) || { ticketPrice: 2 };
            const ticketPrice = lotteryConfig.ticketPrice;
            const userData = userDoc.data() as User;
            const currentBalance = userData.saldo || 0;
            
            if (currentBalance < ticketPrice) {
                const error = new Error("Saldo insuficiente");
                (error as any).code = 'INSUFFICIENT_FUNDS';
                throw error;
            }
            
            const newBalance = currentBalance - ticketPrice;
            transaction.update(userRef, { saldo: newBalance });
            
            const newTicketId = uuidv4();
            const newTicketRef = adminDb.collection("tickets").doc(newTicketId);
            
            const newTicketData: Ticket = {
                id: newTicketId,
                numbers: [...ticketPicks].sort((a,b) => a-b),
                status: 'active',
                createdAt: new Date().toISOString(),
                buyerName: buyerName.trim(),
                buyerPhone: buyerPhone?.trim() || undefined,
                sellerId: sellerId,
                sellerUsername: sellerUsername,
                participants: [sellerId],
            };
            transaction.set(newTicketRef, newTicketData);
            
            return { createdTicket: newTicketData, newBalance: newBalance };
        });

        return { success: true, createdTicket, newBalance };

    } catch (e: any) {
        console.error("Error in createSellerTicketAction:", e);
        if (e.code === 'INSUFFICIENT_FUNDS') {
            return { success: false, error: 'INSUFFICIENT_FUNDS' };
        }
        return { success: false, error: e.message || "An unexpected response was received from the server." };
    }
};

// Ação para criar bilhetes comprados por um cliente
interface CreateClientTicketsParams {
    user: { id: string; username: string };
    cart: number[][];
}

interface CreateClientTicketsResult {
    success: boolean;
    createdTickets?: Ticket[];
    newBalance?: number;
    error?: 'INSUFFICIENT_FUNDS' | string;
}

export const createClientTicketsAction = async ({ user, cart }: CreateClientTicketsParams): Promise<CreateClientTicketsResult> => {
    const userRef = adminDb.collection("users").doc(user.id);
    const configRef = adminDb.collection('configs').doc('global');

    try {
        const { createdTickets, newBalance } = await adminDb.runTransaction(async (transaction) => {
            const configDoc = await transaction.get(configRef);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error("Usuário não encontrado.");
            }

            const lotteryConfig = (configDoc.data() as LotteryConfig) || { ticketPrice: 2 };
            const ticketPrice = lotteryConfig.ticketPrice;
            const totalCost = cart.length * ticketPrice;
            const userData = userDoc.data() as User;
            const currentBalance = userData.saldo || 0;

            if (currentBalance < totalCost) {
                const error = new Error("Saldo insuficiente");
                (error as any).code = 'INSUFFICIENT_FUNDS';
                throw error;
            }

            const newBalance = currentBalance - totalCost;
            transaction.update(userRef, { saldo: newBalance });

            const tickets: Ticket[] = [];
            for (const ticketNumbers of cart) {
                const newTicketId = uuidv4();
                const newTicketRef = adminDb.collection("tickets").doc(newTicketId);
                const newTicketData: Ticket = {
                    id: newTicketId,
                    numbers: ticketNumbers.sort((a, b) => a - b),
                    status: 'active' as const,
                    createdAt: new Date().toISOString(),
                    buyerName: user.username,
                    buyerId: user.id,
                    participants: [user.id],
                };
                transaction.set(newTicketRef, newTicketData);
                tickets.push(newTicketData);
            }
            return { createdTickets: tickets, newBalance };
        });
        return { success: true, createdTickets, newBalance };
    } catch (e: any) {
        if (e.code === 'INSUFFICIENT_FUNDS') {
            return { success: false, error: 'INSUFFICIENT_FUNDS' };
        }
        console.error("Error in createClientTicketsAction:", e);
        return { success: false, error: e.message || 'An unexpected response was received from the server.' };
    }
};
