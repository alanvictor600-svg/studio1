
"use client";

import { useState, type FC } from 'react';
import type { Ticket, Draw } from '@/types'; // Import Draw
import { TicketCard } from '@/components/ticket-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, PlayCircle, Trophy, Clock3 } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  draws?: Draw[]; // Added to receive draw information
}

export const TicketList: FC<TicketListProps> = ({ tickets, draws }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'winning' | 'expired'>('all');

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    return ticket.status === activeTab;
  });

  const tabItems = [
    { value: 'all', label: 'Todos', Icon: List },
    { value: 'active', label: 'Ativos', Icon: PlayCircle },
    { value: 'winning', label: 'Premiados', Icon: Trophy },
    { value: 'expired', label: 'Expirados', Icon: Clock3 },
  ];

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto bg-card/80 backdrop-blur-sm p-1.5 rounded-lg shadow-md">
          {tabItems.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
              <tab.Icon className="mr-2 h-4 w-4" /> {tab.label} ({ tab.value === 'all' ? tickets.length : tickets.filter(t => t.status === tab.value).length })
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              draws={draws} // Pass draws to TicketCard
              // Removed onUpdateTicketStatus prop
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
