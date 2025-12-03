
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NumberButtonProps {
  number: number;
  animalEmoji: string;
  animalName: string;
  onClick: (num: number) => void;
  disabled: boolean;
  isSelected: boolean;
  countInSelection: number;
}

export const NumberButton: FC<NumberButtonProps> = ({
  number,
  animalEmoji,
  animalName,
  onClick,
  disabled,
  isSelected, 
  countInSelection,
}) => {
  return (
    <Button
      variant={countInSelection > 0 ? "default" : "outline"}
      className={cn(
        "relative aspect-square h-auto w-auto text-lg font-semibold p-1 flex flex-col items-center justify-center leading-none",
        "shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:-translate-y-1",
        countInSelection > 0 && "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary/50",
        countInSelection === 0 && "bg-card hover:bg-secondary hover:text-secondary-foreground",
        disabled && countInSelection === 0 && "opacity-50 cursor-not-allowed bg-muted",
        disabled && countInSelection > 0 && "opacity-70 cursor-not-allowed" 
      )}
      onClick={() => onClick(number)}
      disabled={disabled}
      aria-pressed={countInSelection > 0}
      aria-label={`Selecionar ${animalName}, número ${number}${countInSelection > 0 ? `, selecionado ${countInSelection} vezes` : ''}`}
    >
      <span className="text-2xl sm:text-3xl md:text-4xl">{animalEmoji}</span>
      <span className="absolute top-1 left-1 font-bold text-xs bg-black/40 text-white rounded-full h-5 w-5 flex items-center justify-center">
        {number}
      </span>
      <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-tighter mt-0.5">{animalName}</span>
      {countInSelection > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center leading-none shadow-lg"
          aria-label={`${countInSelection} vezes selecionado`}
        >
          {countInSelection}x
        </span>
      )}
    </Button>
  );
};
