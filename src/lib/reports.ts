
"use client";

import type { Ticket, LotteryConfig } from '@/types';

export interface FinancialReport {
    totalRevenue: number;
    sellerCommission: number;
    ownerCommission: number;
    prizePool: number;
    clientRevenue: number;
    sellerRevenue: number;
    clientTicketCount: number;
    sellerTicketCount: number;
}

export function generateFinancialReport(
    allTickets: Ticket[],
    lotteryConfig: LotteryConfig
): FinancialReport {
    const report: FinancialReport = {
        totalRevenue: 0,
        sellerCommission: 0,
        ownerCommission: 0,
        prizePool: 0,
        clientRevenue: 0,
        sellerRevenue: 0,
        clientTicketCount: 0,
        sellerTicketCount: 0
    };

    const activeTickets = allTickets.filter(t => t.status === 'active');
    const clientTickets = activeTickets.filter(t => !t.sellerUsername);
    const vendedorTickets = activeTickets.filter(t => !!t.sellerUsername);
    
    const price = lotteryConfig.ticketPrice || 0;
    const sellerCommPercent = lotteryConfig.sellerCommissionPercentage || 0;
    const ownerCommPercent = lotteryConfig.ownerCommissionPercentage || 0;
    const clientSalesCommPercent = lotteryConfig.clientSalesCommissionToOwnerPercentage || 0;
    
    report.clientTicketCount = clientTickets.length;
    report.sellerTicketCount = vendedorTickets.length;

    report.clientRevenue = report.clientTicketCount * price;
    report.sellerRevenue = report.sellerTicketCount * price;
    report.totalRevenue = report.clientRevenue + report.sellerRevenue;

    report.sellerCommission = report.sellerRevenue * (sellerCommPercent / 100);
    const ownerBaseCommission = report.totalRevenue * (ownerCommPercent / 100);
    const ownerExtraCommission = report.clientRevenue * (clientSalesCommPercent / 100);
    report.ownerCommission = ownerBaseCommission + ownerExtraCommission;

    report.prizePool = report.totalRevenue - report.sellerCommission - report.ownerCommission;
    
    return report;
}
