// src/lib/services/lotteryService.ts
import { collection, addDoc, Firestore } from 'firebase/firestore';

/**
 * Adds a new draw to the 'draws' collection.
 * This can be called from the client as it does not use the admin SDK.
 * @param db - The Firestore instance.
 * @param newNumbers - An array of 5 or 10 numbers for the draw.
 * @param name - An optional name for the draw.
 */
export const addDraw = async (db: Firestore, newNumbers: number[], name?: string): Promise<void> => {
    if (!db) throw new Error("Firestore instance is not available.");
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
