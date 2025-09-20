// src/lib/services/configService.ts
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LotteryConfig, CreditRequestConfig } from '@/types';

/**
 * Saves the main lottery configuration to Firestore.
 * @param newConfig - A partial object of the lottery configuration to be merged.
 */
export const saveLotteryConfig = async (newConfig: Partial<LotteryConfig>): Promise<void> => {
    const configDocRef = doc(db, 'configs', 'global');
    await setDoc(configDocRef, newConfig, { merge: true });
};

/**
 * Saves the credit request contact information to Firestore.
 * @param newConfig - The complete credit request configuration object.
 */
export const saveCreditRequestConfig = async (newConfig: CreditRequestConfig): Promise<void> => {
    const configDocRef = doc(db, 'configs', 'global');
    await setDoc(configDocRef, newConfig, { merge: true });
};

    

    