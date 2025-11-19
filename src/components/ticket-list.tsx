
"use client";

import { useState, type FC } from 'react';
import type { Ticket, Draw } from '@/types'; // Import Draw
import { TicketCard } from '@/components/ticket-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, PlayCircle, Trophy, Clock, Ban, TimerOff } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  draws?: Draw[];
  onRebet?: (numbers: number[]) => void;
  onGenerateReceipt?: (ticket: Ticket) => void;
}

type TabValue = 'all' | 'active' | 'winning' | 'expired' | 'unpaid';


export const TicketList: FC<TicketListProps> = ({ tickets, draws, onRebet, onGenerateReceipt }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') {
      return ticket.status !== 'expired';
    }
    if (activeTab === 'expired') {
      return ticket.status === 'expired';
    }
    if (activeTab === 'unpaid') {
      return ticket.status === 'unpaid';
    }
    return ticket.status === activeTab;
  });

  const getCount = (status: TabValue) => {
    if (status === 'all') return tickets.filter(t => t.status !== 'expired').length;
    if (status === 'expired') return tickets.filter(t => t.status === 'expired').length;
    if (status === 'unpaid') return tickets.filter(t => t.status === 'unpaid').length;
    return tickets.filter(t => t.status === status).length;
  }

  const tabItems: { value: TabValue; label: string; Icon: React.ElementType }[] = [
    { value: 'all', label: 'Todos', Icon: List },
    { value: 'active', label: 'Ativos', Icon: PlayCircle },
    { value: 'winning', label: 'Premiados', Icon: Trophy },
    { value: 'unpaid', label: 'Não Pagos', Icon: Ban },
    { value: 'expired', label: 'Expirados', Icon: TimerOff },
  ];

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto bg-card/80 backdrop-blur-sm p-1.5 rounded-lg shadow-md">
          {tabItems.map(tab => {
            const count = getCount(tab.value);
            if(count === 0 && tab.value !== 'all') return null;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                <tab.Icon className="mr-2 h-4 w-4" /> {tab.label} ({count})
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              draws={draws}
              onRebet={onRebet}
              onGenerateReceipt={onGenerateReceipt}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card/50 rounded-lg shadow">
          <p className="text-muted-foreground text-lg">Nenhum bilhete encontrado para esta categoria.</p>
        </div>
      )}
    </div>
  );
};
