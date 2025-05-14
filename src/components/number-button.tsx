"use client";

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NumberButtonProps {
  number: number;
  onClick: (num: number) => void;
  disabled: boolean;
  isSelected: boolean;
  countInSelection: number;
  animalName?: string;
  animalImageHint?: string;
}

export const NumberButton: FC<NumberButtonProps> = ({
  number,
  onClick,
  disabled,
  isSelected, 
  countInSelection,
  animalName,
  animalImageHint,
}) => {
  return (
    <Button
      variant={countInSelection > 0 ? "default" : "outline"}
      className={cn(
        "relative aspect-square h-auto text-xs sm:text-sm font-semibold p-1 flex flex-col items-center justify-center",
        "shadow-md hover:shadow-lg transition-shadow",
        countInSelection > 0 && "bg-primary text-primary-foreground hover:bg-primary/90",
        countInSelection === 0 && "bg-card hover:bg-secondary hover:text-secondary-foreground",
        disabled && countInSelection === 0 && "opacity-50 cursor-not-allowed bg-muted",
        disabled && countInSelection > 0 && "opacity-70 cursor-not-allowed" 
      )}
      onClick={() => onClick(number)}
      disabled={disabled}
      aria-pressed={countInSelection > 0}
      aria-label={`Selecionar ${animalName || `número ${number}`}${countInSelection > 0 ? `, selecionado ${countInSelection} vezes` : ''}`}
    >
      {animalImageHint && (
        <div className="w-full h-2/3 flex items-center justify-center overflow-hidden mb-0.5">
          <Image
            src={`https://placehold.co/40x40.png`}
            alt={animalName || `Animal para ${number}`}
            width={28}
            height={28}
            className="object-contain"
            data-ai-hint={animalImageHint}
          />
        </div>
      )}
      <span className={cn("block", animalImageHint ? "text-[10px] sm:text-xs" : "text-lg")}>{number}</span>
      {countInSelection > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center leading-none"
          aria-label={`${countInSelection} vezes selecionado`}
        >
          {countInSelection}x
        </span>
      )}
    </Button>
  );
};
