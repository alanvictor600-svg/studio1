
"use client";

import { useState, type FC, useMemo } from 'react';
import type { Ticket, Draw } from '@/types'; // Import Draw
import { TicketCard } from '@/components/ticket-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, PlayCircle, Trophy, Ban, TimerOff } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  draws?: Draw[];
  onRebet?: (numbers: number[]) => void;
  onGenerateReceipt?: (ticket: Ticket) => void;
}

type TabValue = 'all' | 'active' | 'winning' | 'expired' | 'unpaid';

export const TicketList: FC<TicketListProps> = ({ tickets, draws, onRebet, onGenerateReceipt }) => {
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const filteredTickets = useMemo(() => {
    if (activeTab === 'all') {
      return tickets;
    }
    return tickets.filter(ticket => ticket.status === activeTab);
  }, [tickets, activeTab]);

  const getCount = (status: TabValue): number => {
    if (status === 'all') {
      return tickets.length;
    }
    return tickets.filter(t => t.status === status).length;
  };

  const tabItems: { value: TabValue; label: string; Icon: React.ElementType }[] = [
    { value: 'all', label: 'Todos', Icon: List },
    { value: 'active', label: 'Ativos', Icon: PlayCircle },
    { value: 'winning', label: 'Premiados', Icon: Trophy },
    { value: 'unpaid', label: 'Não Pagos', Icon: Ban },
    { value: 'expired', label: 'Expirados', Icon: TimerOff },
  ];
  
  const visibleTabs = useMemo(() => {
    return tabItems.filter(tab => {
        // "Todos" is always visible if there are any tickets
        if (tab.value === 'all') return tickets.length > 0;
        // Other tabs are visible only if they have tickets
        return getCount(tab.value) > 0;
    });
  }, [tickets]);


  if (!tickets || tickets.length === 0) {
      return (
        <div className="text-center py-10 bg-card/50 rounded-lg shadow">
          <List size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg">Nenhum bilhete encontrado.</p>
          <p className="text-sm text-muted-foreground/80">Quando você criar ou vender bilhetes, eles aparecerão aqui.</p>
        </div>
      );
  }

  return (
    <div>
       {visibleTabs.length > 1 && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto bg-card/80 backdrop-blur-sm p-1.5 rounded-lg shadow-md">
                {tabItems.map(tab => {
                    const count = getCount(tab.value);
                    // Render the tab trigger if it's supposed to be visible
                    if (visibleTabs.some(visibleTab => visibleTab.value === tab.value)) {
                    return (
                        <TabsTrigger key={tab.value} value={tab.value} className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200">
                        <tab.Icon className="mr-2 h-4 w-4" /> {tab.label} ({count})
                        </TabsTrigger>
                    );
                    }
                    return null;
                })}
                </TabsList>
            </Tabs>
       )}


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
