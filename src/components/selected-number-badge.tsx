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
    <Badge
      variant="secondary"
      className="flex items-center gap-2 text-base relative h-8 px-3 shadow-sm bg-primary/20 border border-primary/30"
      aria-label={`Número ${number} (${animal?.name}) selecionado. Posição ${index + 1}.`}
    >
      <span className="text-lg -ml-1">{animal?.emoji}</span>
      <span className="font-bold text-foreground">{number}</span>
      <button
        onClick={() => onRemove(index)}
        className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 text-destructive"
        aria-label={`Remover número ${number}`}
      >
        <X size={14} />
      </button>
    </Badge>
  );
};
