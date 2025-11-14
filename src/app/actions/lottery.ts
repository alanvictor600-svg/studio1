'use server';

import { adminDb } from '@/lib/firebase-admin';
import { collection, writeBatch, getDocs, query, where, doc } from 'firebase/firestore';
import type { User, Ticket, LotteryConfig, AdminHistoryEntry, SellerHistoryEntry } from '@/types';
import type { FinancialReport } from '@/lib/reports';

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


interface StartNewLotteryParams {
    allUsers: User[];
    processedTickets: Ticket[];
    lotteryConfig: LotteryConfig;
    financialReport: FinancialReport;
}
/**
 * Starts a new lottery cycle using the admin SDK.
 * This is a server action that performs all database writes in a single batch.
 */
export const startNewLotteryAction = async ({ allUsers, processedTickets, lotteryConfig, financialReport }: StartNewLotteryParams): Promise<void> => {
    const batch = adminDb.batch();

    // 1. Capture Seller History
    const sellers = allUsers.filter(u => u.role === 'vendedor');
    for (const seller of sellers) {
        const sellerTickets = processedTickets.filter(ticket => ticket.status === 'active' && ticket.sellerId === seller.id);
        const activeSellerTicketsCount = sellerTickets.length;
        
        if (activeSellerTicketsCount > 0) {
            const totalRevenueFromActiveTickets = activeSellerTicketsCount * lotteryConfig.ticketPrice;
            const commissionEarned = totalRevenueFromActiveTickets * (lotteryConfig.sellerCommissionPercentage / 100);
            
            const newEntry: Omit<SellerHistoryEntry, 'id'> = {
                sellerId: seller.id,
                sellerUsername: seller.username,
                endDate: new Date().toISOString(),
                activeTicketsCount: activeSellerTicketsCount,
                totalRevenue: totalRevenueFromActiveTickets,
                totalCommission: commissionEarned,
            };
            const newHistoryDocRef = adminDb.collection('sellerHistory').doc();
            batch.set(newHistoryDocRef, newEntry);
        }
    }

    // 2. Capture Admin History
    if (financialReport && (financialReport.totalRevenue > 0 || financialReport.clientTicketCount > 0 || financialReport.sellerTicketCount > 0)) {
        const newHistoryEntry: Omit<AdminHistoryEntry, 'id'> = {
            endDate: new Date().toISOString(),
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

    // 3. Reset Draws
    const drawsSnapshot = await adminDb.collection('draws').get();
    drawsSnapshot.forEach(drawDoc => {
        batch.delete(drawDoc.ref);
    });

    // 4. Reset Tickets
    const ticketsSnapshot = await adminDb.collection('tickets').where('status', 'in', ['active', 'winning', 'unpaid']).get();
    ticketsSnapshot.forEach(ticketDoc => {
        batch.update(ticketDoc.ref, { status: 'expired' });
    });

    // Commit all operations at once
    await batch.commit();
};
