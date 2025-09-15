
"use client";

import { useState, useEffect, type FC } from 'react';
import type { Ticket, LotteryConfig, SellerHistoryEntry, User } from '@/types';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import { TicketList } from '@/components/ticket-list';
import { Ticket as TicketIcon } from 'lucide-react';


interface SellerDashboardProps {
    isLotteryPaused?: boolean;
    lotteryConfig: LotteryConfig;
    onTicketCreated: (ticket: Ticket) => void;
    userTickets: Ticket[];
    currentUser: User | null;
}

export const SellerDashboard: FC<SellerDashboardProps> = ({ 
    isLotteryPaused,
    lotteryConfig,
    onTicketCreated,
    userTickets,
    currentUser
}) => {
    
    return (
        <div className="space-y-12">
            <SellerTicketCreationForm
                isLotteryPaused={isLotteryPaused}
                onTicketCreated={onTicketCreated}
                lotteryConfig={lotteryConfig}
            />
            <section>
                <h2 className="text-2xl font-bold text-center text-primary mb-6 flex items-center justify-center">
                    <TicketIcon className="mr-3 h-6 w-6" />
                    Meus Bilhetes Vendidos (Ciclo Atual)
                </h2>
                <TicketList tickets={userTickets} />
            </section>
        </div>
    );
};
