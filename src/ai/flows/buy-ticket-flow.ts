'use server';
/**
 * @fileOverview A server-side flow for securely purchasing lottery tickets.
 *
 * - buyTicket - A function that handles the ticket purchase process.
 * - BuyTicketInput - The input type for the buyTicket function.
 * - BuyTicketOutput - The return type for the buyTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getLotteryConfig} from '@/services/lottery-service';
import admin from 'firebase-admin';
import {getApps, initializeApp, cert} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';
import type {Ticket} from '@/types';

let db: Firestore;

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  // IMPORTANT: This service account setup is for demonstration.
  // In a production environment, use environment variables or a secrets manager.
  // The service-account.json file should be secured and not committed to your repository.
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
          credential: cert(serviceAccount),
        });
        db = getFirestore();
      } catch(e) {
          console.error("Could not initialize Firebase Admin SDK. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set and is valid JSON.", e);
      }
  } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK not initialized.");
  }
} else {
    // If the app is already initialized, just get the firestore instance
    db = getFirestore();
}

const BuyTicketInputSchema = z.object({
  userId: z.string().describe('The ID of the user purchasing the ticket.'),
  numbers: z.array(z.number()).length(10).describe('An array of 10 numbers for the ticket.'),
  buyerName: z.string().describe('The name of the ticket buyer (can be the user or a customer for a seller).'),
  buyerPhone: z.string().optional().describe('The optional phone number of the buyer.'),
});
export type BuyTicketInput = z.infer<typeof BuyTicketInputSchema>;

const BuyTicketOutputSchema = z.object({
  success: z.boolean(),
  ticket: z.optional(z.custom<Ticket>()),
  newBalance: z.optional(z.number()),
  error: z.optional(z.string()),
});
export type BuyTicketOutput = z.infer<typeof BuyTicketOutputSchema>;

export async function buyTicket(input: BuyTicketInput): Promise<BuyTicketOutput> {
  return buyTicketFlow(input);
}

const buyTicketFlow = ai.defineFlow(
  {
    name: 'buyTicketFlow',
    inputSchema: BuyTicketInputSchema,
    outputSchema: BuyTicketOutputSchema,
  },
  async (input) => {
    // Ensure admin is initialized before proceeding
    if (!db) {
        return {
            success: false,
            error: "Firebase Admin SDK is not initialized. Check server configuration and FIREBASE_SERVICE_ACCOUNT_KEY.",
        };
    }
      
    const lotteryConfig = getLotteryConfig(); // This is currently sync, reading from a static source.
    const ticketPrice = lotteryConfig.ticketPrice;
    
    const userRef = db.collection('users').doc(input.userId);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User not found.");
            }

            const userData = userDoc.data();
            const currentBalance = userData?.saldo || 0;

            if (currentBalance < ticketPrice) {
                throw new Error("Insufficient credits.");
            }
            
            const newBalance = currentBalance - ticketPrice;

            const newTicketRef = db.collection('tickets').doc();
            
            const newTicketData = {
                id: newTicketRef.id,
                numbers: input.numbers,
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                buyerName: input.buyerName,
                buyerPhone: input.buyerPhone || '',
                buyerId: userData?.role === 'cliente' ? input.userId : undefined,
                sellerId: userData?.role === 'vendedor' ? input.userId : undefined,
                sellerUsername: userData?.role === 'vendedor' ? userData.username : null,
            };

            transaction.set(newTicketRef, newTicketData);
            transaction.update(userRef, { saldo: newBalance });

            return { ticket: newTicketData as Ticket, newBalance: newBalance };
        });

        return {
            success: true,
            ticket: result.ticket,
            newBalance: result.newBalance,
        };

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        return {
            success: false,
            error: e.message || "An unknown error occurred during the transaction.",
        };
    }
  }
);
