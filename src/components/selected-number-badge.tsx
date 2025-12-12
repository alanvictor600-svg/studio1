"use client";

import type { FC } from 'react';
import { X } from 'lucide-react';
import { animalMapping } from '@/lib/lottery-utils';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface SelectedNumberBadgeProps {
  number: number;
  index: number;
  onRemove: (index: number) => void;
}

export const SelectedNumberBadge: FC<SelectedNumberBadgeProps> = ({ number, index, onRemove }) => {
  const animal = animalMapping.find(a => a.number === number);

  return (
    <div className="relative pt-1 pr-1">
        <Badge
        variant="secondary"
        className="flex items-center gap-2 text-base h-8 pl-2 pr-3 shadow-sm bg-primary/20 border border-primary/30"
        aria-label={`Número ${number} (${animal?.name}) selecionado. Posição ${index + 1}.`}
        >
            <span className="text-lg -ml-1">{animal?.emoji}</span>
            <span className="font-bold text-foreground">{number}</span>
        </Badge>
        <button
            onClick={() => onRemove(index)}
            className="absolute -top-0 -right-0 z-10 p-0.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-transform hover:scale-110"
            aria-label={`Remover número ${number}`}
        >
            <X size={12} strokeWidth={3} />
        </button>
    </div>
  );
};
