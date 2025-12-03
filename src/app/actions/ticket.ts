
'use server';

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import type { Ticket, LotteryConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { adminOptions } from '@/lib/firebase-admin-config';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  admin.initializeApp(adminOptions);
}

const adminDb = admin.firestore();

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
}: CreateSellerTicketParams): Promise<{ createdTicket?: Ticket, success: boolean, error?: string }> => {
    if (!sellerId) return { success: false, error: "Vendedor não autenticado." };
    if (ticketPicks.length !== 10) return { success: false, error: "O bilhete deve conter 10 números." };
    if (!buyerName) return { success: false, error: "O nome do comprador é obrigatório." };

    const userRef = adminDb.collection("users").doc(sellerId);
    
    let createdTicket: Ticket | null = null;

    try {
      await adminDb.runTransaction(async (transaction) => {
          const configDoc = await transaction.get(adminDb.collection('configs').doc('global'));
          const lotteryConfig = configDoc.data() as LotteryConfig || { ticketPrice: 2 };
          const ticketPrice = lotteryConfig.ticketPrice;
          
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists) throw new Error("Usuário do vendedor não encontrado.");
          
          const currentBalance = userDoc.data()?.saldo || 0;
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
          };
          transaction.set(newTicketRef, newTicketData);
          createdTicket = newTicketData;
      });

      if (!createdTicket) throw new Error("Falha ao criar o bilhete na transação.");

      return { success: true, createdTicket };

    } catch (e: any) {
        if (e.code === 'INSUFFICIENT_FUNDS') {
            return { success: false, error: 'INSUFFICIENT_FUNDS' };
        }
        return { success: false, error: e.message || "Erro desconhecido no servidor." };
    }
};

// Ação para criar bilhetes comprados por um cliente
interface CreateClientTicketsParams {
    user: { id: string; username: string };
    cart: number[][];
}

interface CreateClientTicketsResult {
    success: boolean;
    error?: 'INSUFFICIENT_FUNDS' | string;
}

export const createClientTicketsAction = async ({ user, cart }: CreateClientTicketsParams): Promise<CreateClientTicketsResult> => {
    const userRef = adminDb.collection("users").doc(user.id);
    const configRef = adminDb.collection('configs').doc('global');

    try {
        await adminDb.runTransaction(async (transaction) => {
            const [configDoc, userDoc] = await Promise.all([
                transaction.get(configRef),
                transaction.get(userRef)
            ]);

            if (!userDoc.exists) {
                throw new Error("Usuário não encontrado.");
            }

            const lotteryConfig = (configDoc.data() as LotteryConfig) || { ticketPrice: 2 };
            const ticketPrice = lotteryConfig.ticketPrice;
            const totalCost = cart.length * ticketPrice;
            const currentBalance = userDoc.data()?.saldo || 0;

            if (currentBalance < totalCost) {
                const error = new Error("Saldo insuficiente");
                (error as any).code = 'INSUFFICIENT_FUNDS';
                throw error;
            }

            const newBalance = currentBalance - totalCost;

            transaction.update(userRef, { saldo: newBalance });

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
                };
                transaction.set(newTicketRef, newTicketData);
            }
        });
        return { success: true };
    } catch (e: any) {
        if (e.code === 'INSUFFICIENT_FUNDS') {
            return { success: false, error: 'INSUFFICIENT_FUNDS' };
        }
        console.error("Error in createClientTicketsAction:", e);
        return { success: false, error: e.message || 'Ocorreu um erro no servidor.' };
    }
};
