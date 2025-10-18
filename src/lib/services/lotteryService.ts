

// src/lib/services/lotteryService.ts
import { db } from '@/lib/firebase';
import { collection, addDoc, writeBatch, getDocs, query, where, doc } from 'firebase/firestore';
import type { User, Ticket, LotteryConfig, AdminHistoryEntry, SellerHistoryEntry } from '@/types';
import type { FinancialReport } from '@/lib/reports';

/**
 * Adds a new draw to the 'draws' collection.
 * @param newNumbers - An array of 5 numbers for the draw.
 * @param name - An optional name for the draw.
 */
export const addDraw = async (newNumbers: number[], name?: string): Promise<void> => {
    if (newNumbers.length !== 5) {
        throw new Error("O sorteio deve conter exatamente 5 números.");
    }

    const newDrawData = {
        numbers: newNumbers,
        createdAt: new Date().toISOString(),
        name: name || undefined,
    };
    
    await addDoc(collection(db, 'draws'), newDrawData);
};


interface StartNewLotteryParams {
    allUsers: User[];
    processedTickets: Ticket[];
    lotteryConfig: LotteryConfig;
    financialReport: FinancialReport;
}
/**
 * Starts a new lottery cycle. This involves:
 * 1. Saving a history entry for each active seller.
 * 2. Saving a history entry for the admin financial summary.
 * 3. Deleting all current draws.
 * 4. Expiring all active, winning, and unpaid tickets.
 */
export const startNewLottery = async ({ allUsers, processedTickets, lotteryConfig, financialReport }: StartNewLotteryParams): Promise<void> => {
    const batch = writeBatch(db);

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
            const newHistoryDocRef = doc(collection(db, 'sellerHistory'));
            batch.set(newHistoryDocRef, newEntry);
        }
    }

    // 2. Capture Admin History
    if (financialReport && financialReport.totalRevenue > 0) {
        const newHistoryEntry: Omit<AdminHistoryEntry, 'id'> = {
            endDate: new Date().toISOString(),
            totalRevenue: financialReport.totalRevenue,
            totalSellerCommission: financialReport.sellerCommission,
            totalOwnerCommission: financialReport.ownerCommission,
            totalPrizePool: financialReport.prizePool,
            clientTicketCount: financialReport.clientTicketCount,
            sellerTicketCount: financialReport.sellerTicketCount,
        };
        const newAdminHistoryDocRef = doc(collection(db, 'adminHistory'));
        batch.set(newAdminHistoryDocRef, newHistoryEntry);
    }


    // 3. Reset Draws
    const drawsSnapshot = await getDocs(query(collection(db, 'draws')));
    drawsSnapshot.forEach(drawDoc => {
        batch.delete(drawDoc.ref);
    });

    // 4. Reset Tickets
    const ticketsSnapshot = await getDocs(query(collection(db, 'tickets'), where('status', 'in', ['active', 'winning', 'unpaid'])));
    ticketsSnapshot.forEach(ticketDoc => {
        batch.update(ticketDoc.ref, { status: 'expired' });
    });

    // Commit all operations at once
    await batch.commit();
};
