// src/lib/services/lotteryService.ts
import { db } from '@/lib/firebase-client';
import { collection, addDoc, writeBatch, getDocs, query, where, doc } from 'firebase/firestore';
import type { User, Ticket, LotteryConfig, AdminHistoryEntry, SellerHistoryEntry } from '@/types';
import type { FinancialReport } from '@/lib/reports';

/**
 * Adds a new draw to the 'draws' collection.
 * This can be called from the client as it does not use the admin SDK.
 * @param newNumbers - An array of 5 or 10 numbers for the draw.
 * @param name - An optional name for the draw.
 */
export const addDraw = async (newNumbers: number[], name?: string): Promise<void> => {
    if (newNumbers.length !== 5 && newNumbers.length !== 10) {
        throw new Error("O sorteio deve conter 5 ou 10 números.");
    }

    const newDrawData = {
        numbers: newNumbers,
        createdAt: new Date().toISOString(),
        // Only include the name if it's a non-empty string
        ...(name && { name }),
    };
    
    await addDoc(collection(db, 'draws'), newDrawData);
};
