
"use client";

import type { FC } from 'react';
import { History } from 'lucide-react';
import { AdminDrawList } from '@/components/admin-draw-list';
import type { Draw } from '@/types';

interface DrawHistorySectionProps {
  draws: Draw[];
}

export const DrawHistorySection: FC<DrawHistorySectionProps> = ({ draws }) => {
  return (
    <section aria-labelledby="draw-history-heading">
      <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <History className="mr-3 h-8 w-8 text-primary" />
        Resultados dos Sorteios
      </h2>
      <AdminDrawList draws={draws} />
    </section>
  );
};
