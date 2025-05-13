
"use client";

import type { FC } from 'react';
import type { Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Hash } from 'lucide-react';

interface AdminDrawCardProps {
  draw: Draw;
}

export const AdminDrawCard: FC<AdminDrawCardProps> = ({ draw }) => {
  return (
    <Card className="shadow-lg bg-card text-card-foreground border-border">
      <CardHeader className="pb-3 flex flex-row justify-between items-center">
        <CardTitle className="text-lg flex items-center">
          <Hash className="mr-2 h-5 w-5 text-primary" />
          Sorteio ID: <span className="font-mono text-sm opacity-80 ml-1.5">#{draw.id.substring(0, 8)}</span>
        </CardTitle>
        <div className="text-xs opacity-80 flex items-center text-muted-foreground">
          <CalendarDays size={14} className="mr-1.5" />
          Registrado em: {format(parseISO(draw.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <p className="text-sm font-medium mb-1 opacity-90 text-muted-foreground">Números Sorteados (5):</p>
          <div className="flex flex-wrap gap-2">
            {draw.numbers.map((num, index) => (
              <Badge
                key={index}
                variant="default"
                className="text-lg font-bold px-3 py-1.5 shadow-md bg-primary text-primary-foreground"
              >
                {num}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
