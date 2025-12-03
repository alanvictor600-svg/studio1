
'use server';

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';
import type { User, Ticket, LotteryConfig, AdminHistoryEntry, SellerHistoryEntry, Draw } from '@/types';
import { generateFinancialReport } from '@/lib/reports';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';

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


/**
 * Adds a new draw to the 'draws' collection using the admin SDK.
 * This is a server action and must be called from the client.
 * @param newNumbers - An array of 5 or 10 numbers for the draw.
 * @param name - An optional name for the draw.
 */
export const addDrawAction = async (newNumbers: number[], name?: string): Promise<void> => {
    if (newNumbers.length !== 5 && newNumbers.length !== 10) {
        throw new Error("O sorteio deve conter 5 ou 10 números.");
    }

    const newDrawData = {
        numbers: newNumbers,
        createdAt: new Date().toISOString(),
        ...(name && { name }),
    };
    
    await adminDb.collection('draws').add(newDrawData);
};

/**
 * Starts a new lottery cycle using the admin SDK.
 * This server action is self-contained and fetches all necessary data from the database
 * to ensure consistency and prevent acting on stale client-side data.
 * It performs all database writes in a single atomic batch operation.
 */
export const startNewLotteryAction = async (): Promise<void> => {
    const batch = adminDb.batch();
    const endDate = new Date().toISOString();

    // --- 1. Fetch all required data directly from the server ---
    const configDoc = await adminDb.doc('configs/global').get();
    const lotteryConfig = configDoc.data() as LotteryConfig;
    if (!lotteryConfig) {
        throw new Error("Global lottery config not found.");
    }

    const usersSnapshot = await adminDb.collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

    const ticketsSnapshot = await adminDb.collection('tickets').get();
    const allTickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));

    const drawsSnapshot = await adminDb.collection('draws').get();
    const allDraws = drawsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draw));

    // --- 2. Process data using utility functions ---
    const processedTickets = updateTicketStatusesBasedOnDraws(allTickets, allDraws);
    const financialReport = generateFinancialReport(processedTickets, lotteryConfig);

    // --- 3. Generate History Entries based on fresh data ---
    
    // Capture Seller History
    const sellers = allUsers.filter(u => u.role === 'vendedor');
    for (const seller of sellers) {
        // Consider only tickets that were sold by this seller in the current cycle
        const sellerTicketsInCycle = processedTickets.filter(ticket => 
            (ticket.status === 'active' || ticket.status === 'winning') && ticket.sellerId === seller.id
        );
        const activeSellerTicketsCount = sellerTicketsInCycle.length;
        
        if (activeSellerTicketsCount > 0) {
            const totalRevenueFromSeller = activeSellerTicketsCount * lotteryConfig.ticketPrice;
            const commissionEarned = totalRevenueFromSeller * (lotteryConfig.sellerCommissionPercentage / 100);
            
            const newEntry: Omit<SellerHistoryEntry, 'id'> = {
                sellerId: seller.id,
                sellerUsername: seller.username,
                endDate,
                activeTicketsCount: activeSellerTicketsCount,
                totalRevenue: totalRevenueFromSeller,
                totalCommission: commissionEarned,
            };
            const newHistoryDocRef = adminDb.collection('sellerHistory').doc();
            batch.set(newHistoryDocRef, newEntry);
        }
    }

    // Capture Admin History
    if (financialReport && (financialReport.totalRevenue > 0 || financialReport.clientTicketCount > 0 || financialReport.sellerTicketCount > 0)) {
        const newHistoryEntry: Omit<AdminHistoryEntry, 'id'> = {
            endDate,
            totalRevenue: financialReport.totalRevenue || 0,
            totalSellerCommission: financialReport.sellerCommission || 0,
            totalOwnerCommission: financialReport.ownerCommission || 0,
            totalPrizePool: financialReport.prizePool || 0,
            clientTicketCount: financialReport.clientTicketCount || 0,
            sellerTicketCount: financialReport.sellerTicketCount || 0,
        };
        const newAdminHistoryDocRef = adminDb.collection('adminHistory').doc();
        batch.set(newAdminHistoryDocRef, newHistoryEntry);
    }

    // --- 4. Reset Cycle Data ---

    // Delete all draws from the current cycle
    drawsSnapshot.forEach(drawDoc => {
        batch.delete(drawDoc.ref);
    });

    // Set all active-like tickets to 'expired'
    // This query is more robust than relying on a potentially stale 'processedTickets' array
    const ticketsToExpireSnapshot = await adminDb.collection('tickets').where('status', 'in', ['active', 'winning', 'awaiting_payment', 'unpaid']).get();
    ticketsToExpireSnapshot.forEach(ticketDoc => {
        batch.update(ticketDoc.ref, { status: 'expired' });
    });

    // --- 5. Commit all operations at once ---
    await batch.commit();
};
