
// src/lib/services/configService.ts
import { doc, setDoc, Firestore } from 'firebase/firestore';
import type { LotteryConfig, CreditRequestConfig } from '@/types';

/**
 * Saves the main lottery configuration to Firestore.
 * @param db - The Firestore instance.
 * @param newConfig - A partial object of the lottery configuration to be merged.
 */
export const saveLotteryConfig = async (db: Firestore, newConfig: Partial<LotteryConfig>): Promise<void> => {
    if (!db) throw new Error("Firestore instance is not available.");
    const configDocRef = doc(db, 'configs', 'global');
    await setDoc(configDocRef, newConfig, { merge: true });
};

/**
 * Saves the credit request contact information to Firestore.
 * @param db - The Firestore instance.
 * @param newConfig - The complete credit request configuration object.
 */
export const saveCreditRequestConfig = async (db: Firestore, newConfig: CreditRequestConfig): Promise<void> => {
    if (!db) throw new Error("Firestore instance is not available.");
    const configDocRef = doc(db, 'configs', 'global');
    await setDoc(configDocRef, newConfig, { merge: true });
};

    