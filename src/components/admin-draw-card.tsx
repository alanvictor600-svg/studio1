
"use client";

import type { FC } from 'react';
import type { Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Hash, Edit3, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminDrawCardProps {
  draw: Draw;
}

export const AdminDrawCard: FC<AdminDrawCardProps> = ({ draw }) => {
  return (
    <Card className="relative overflow-hidden shadow-2xl bg-gradient-to-br from-primary via-blue-600 to-secondary text-primary-foreground border-none">
       <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-900/[0.04] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
       <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse delay-500"></div>

      <CardHeader className="pb-4 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-y-2">
            <CardTitle className="text-lg flex items-center font-bold">
                <Hash className="mr-2 h-5 w-5 shrink-0" />
                <span className="truncate">
                Sorteio ID: <span className="font-mono text-sm opacity-90 ml-1.5">#{draw.id.substring(0, 8)}</span>
                </span>
            </CardTitle>
            <div className="text-xs opacity-90 flex items-center text-right shrink-0">
                <CalendarDays size={14} className="mr-1.5" />
                {format(parseISO(draw.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
        </div>
        {draw.name && (
            <CardDescription className="text-sm text-primary-foreground/80 mt-2 flex items-center pt-2 border-t border-primary-foreground/20">
                <Edit3 size={14} className="mr-2 shrink-0" />
                <span>{draw.name}</span>
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div>
          <p className="text-sm font-semibold mb-3 text-center text-primary-foreground/90 tracking-wider">Números Sorteados</p>
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center">
            {draw.numbers.map((num, index) => (
              <div
                key={index}
                className={cn(
                  "relative h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center",
                  "bg-white/20 backdrop-blur-sm shadow-inner shadow-white/10 border border-white/30",
                  "font-bold text-3xl sm:text-4xl text-primary-foreground",
                  "transform transition-transform hover:scale-110"
                )}
              >
                 <Star className="absolute h-full w-full text-yellow-300/20 animate-[spin_15s_linear_infinite]" />
                 <span className="z-10">{num}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
