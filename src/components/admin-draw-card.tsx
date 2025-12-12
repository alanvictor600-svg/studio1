
"use client";

import type { FC } from 'react';
import type { Draw } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Hash, Clover, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminDrawCardProps {
  draw: Draw;
}

export const AdminDrawCard: FC<AdminDrawCardProps> = ({ draw }) => {
  return (
    <Card className="relative overflow-hidden shadow-2xl bg-gradient-to-br from-primary/90 via-primary to-secondary/90 text-primary-foreground border-none h-full flex flex-col">
       <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-900/[0.04] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
       <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
       <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse delay-500"></div>

      <CardHeader className="pb-4 relative z-10">
         <CardTitle className="text-2xl font-bold text-primary-foreground text-center flex items-center justify-center">
            <History className="mr-3 h-6 w-6" /> Resultados
         </CardTitle>
        {draw.name && (
            <CardDescription className="text-lg font-semibold text-primary-foreground/90 flex items-center justify-center text-center drop-shadow-lg pt-2">
                <Clover size={20} className="mr-2 shrink-0 text-green-300" />
                <span>{draw.name}</span>
            </CardDescription>
        )}
      </CardHeader>
      <CardContent className="relative z-10 flex-grow flex flex-col justify-center">
          <p className="text-sm font-semibold mb-3 text-center text-primary-foreground/90 tracking-wider">Números Sorteados</p>
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center">
            {draw.numbers.map((num, index) => (
              <div
                key={index}
                className={cn(
                  "relative h-14 w-14 sm:h-20 sm:w-20 rounded-full flex items-center justify-center",
                  "bg-white/20 backdrop-blur-sm shadow-inner shadow-white/10 border border-white/30",
                  "font-bold text-2xl sm:text-4xl text-primary-foreground",
                  "transform transition-transform hover:scale-110"
                )}
              >
                 <Clover className="absolute h-full w-full text-green-300/20 animate-[spin_15s_linear_infinite]" />
                 <span className="z-10">{num}</span>
              </div>
            ))}
          </div>
      </CardContent>
      <CardFooter className="relative z-10 pt-6 mt-4 border-t border-primary-foreground/20 flex justify-between items-center text-xs opacity-90 gap-4">
         <div className="flex items-center">
            <Hash className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="truncate">
            ID: <span className="font-mono text-sm opacity-90 ml-1">#{draw.id.substring(0, 8)}</span>
            </span>
        </div>
        <div className="flex items-center text-right shrink-0">
            <CalendarDays size={14} className="mr-1.5" />
            {format(parseISO(draw.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </CardFooter>
    </Card>
  );
};
