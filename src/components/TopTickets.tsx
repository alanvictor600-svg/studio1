
"use client";

import type { FC } from 'react';
import { useMemo } from 'react';
import type { Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { countOccurrences } from '@/lib/lottery-utils';
import { Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TopTicketsProps {
  draws: Draw[];
}

export const TopTickets: FC<TopTicketsProps> = ({ draws }) => {

  const drawnNumbersFrequency = useMemo(() => {
    if (!draws || draws.length === 0) {
      return [];
    }
    const occurrences = countOccurrences(draws.flatMap(draw => draw.numbers));
    return Object.entries(occurrences)
      .map(([num, count]) => ({ number: parseInt(num, 10), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Show top 10 most frequent numbers
  }, [draws]);

  if (draws.length === 0 || drawnNumbersFrequency.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center">
              <Star className="mr-3 h-6 w-6" /> Números da Sorte
           </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground text-center">Aguardando o primeiro sorteio do ciclo para exibir estatísticas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
       <CardHeader>
           <CardTitle className="text-2xl font-bold text-primary text-center flex items-center justify-center">
              <TrendingUp className="mr-3 h-6 w-6" /> Números da Sorte do Ciclo
           </CardTitle>
        </CardHeader>
      <CardContent className="p-4 flex-grow flex items-center justify-center">
        <div className="flex flex-wrap gap-4 justify-center">
            {drawnNumbersFrequency.map(({ number, count }, index) => (
                <div key={number} className="relative flex flex-col items-center space-y-2">
                    <Badge
                        variant="default"
                        className={cn(
                            "font-mono text-2xl font-bold h-16 w-16 flex items-center justify-center rounded-full shadow-lg border-2",
                            index === 0 && "bg-yellow-500 text-white border-yellow-600 scale-110",
                            index === 1 && "bg-gray-400 text-white border-gray-500 scale-105",
                            index === 2 && "bg-orange-600 text-white border-orange-700",
                            index > 2 && "bg-primary/80"
                        )}
                    >
                        {number}
                    </Badge>
                     <Badge
                        variant="secondary"
                        className="text-xs"
                    >
                        {count}x
                    </Badge>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
