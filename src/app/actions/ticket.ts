
'use server';

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';
import type { Ticket, LotteryConfig } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: firebaseConfig.projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
    } catch (e) {
        console.error("Firebase admin initialization error", e);
    }
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
}: CreateSellerTicketParams): Promise<{ createdTicket: Ticket }> => {
    if (!sellerId) throw new Error("Vendedor não autenticado.");
    if (ticketPicks.length !== 10) throw new Error("O bilhete deve conter 10 números.");
    if (!buyerName) throw new Error("O nome do comprador é obrigatório.");

    const userRef = adminDb.collection("users").doc(sellerId);
    
    let createdTicket: Ticket | null = null;

    await adminDb.runTransaction(async (transaction) => {
        const configDoc = await transaction.get(adminDb.collection('configs').doc('global'));
        const lotteryConfig = configDoc.data() as LotteryConfig || { ticketPrice: 2 };
        const ticketPrice = lotteryConfig.ticketPrice;
        
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Usuário do vendedor não encontrado.");
        
        const currentBalance = userDoc.data()?.saldo || 0;
        if (currentBalance < ticketPrice) throw new Error("Saldo insuficiente.");

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

    return { createdTicket };
};

// Ação para criar bilhetes comprados por um cliente
interface CreateClientTicketsParams {
    user: { id: string; username: string };
    cart: number[][];
}

export const createClientTicketsAction = async ({ user, cart }: CreateClientTicketsParams): Promise<void> => {
    const userRef = adminDb.collection("users").doc(user.id);
    const configRef = adminDb.collection('configs').doc('global');

    await adminDb.runTransaction(async (transaction) => {
        // 1. Ler todos os dados necessários DENTRO da transação.
        const [configDoc, userDoc] = await Promise.all([
            transaction.get(configRef),
            transaction.get(userRef)
        ]);

        if (!userDoc.exists) {
            throw new Error("Usuário não encontrado.");
        }

        // 2. Realizar cálculos e validações
        const lotteryConfig = (configDoc.data() as LotteryConfig) || { ticketPrice: 2 };
        const ticketPrice = lotteryConfig.ticketPrice;
        const totalCost = cart.length * ticketPrice;
        const currentBalance = userDoc.data()?.saldo || 0;

        if (currentBalance < totalCost) {
            throw new Error("Saldo insuficiente.");
        }

        const newBalance = currentBalance - totalCost;

        // 3. Executar todas as escritas DENTRO da transação
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
    // A transação não retorna nada. O cliente é atualizado via onSnapshot.
};
