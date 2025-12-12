
"use client";

import type { FC } from 'react';
import { PlusCircle } from 'lucide-react';
import { AdminDrawForm } from '@/components/admin-draw-form';

interface NewDrawSectionProps {
  onAddDraw: (numbers: number[], name?: string) => void;
  hasWinningTickets: boolean;
}

export const NewDrawSection: FC<NewDrawSectionProps> = ({ onAddDraw, hasWinningTickets }) => {
  return (
    <section aria-labelledby="draw-submission-heading">
      <h2 id="draw-submission-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <PlusCircle className="mr-3 h-8 w-8 text-primary" />
        Cadastrar Novo Sorteio
      </h2>
      <AdminDrawForm onAddDraw={onAddDraw} hasWinningTickets={hasWinningTickets} />
    </section>
  );
};
