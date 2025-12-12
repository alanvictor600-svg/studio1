
// src-lib/services/userService.ts
import { doc, runTransaction, Firestore } from 'firebase/firestore';

/**
 * Updates a user's credit balance. Can be a positive or negative amount.
 * @param db - The Firestore instance.
 * @param userId - The ID of the user to update.
 * @param amount - The amount to add (positive) or remove (negative) from the balance.
 * @returns The new balance of the user.
 */
export const updateUserCredits = async (db: Firestore, userId: string, amount: number): Promise<number> => {
    if (!db) throw new Error("Firestore instance is not available.");
    const userRef = doc(db, 'users', userId);
    
    return await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("Usuário não encontrado.");
        }
        
        const currentBalance = userDoc.data().saldo || 0;
        const newBalance = currentBalance + amount;
        
        transaction.update(userRef, { saldo: newBalance });
        
        return newBalance;
    });
};
