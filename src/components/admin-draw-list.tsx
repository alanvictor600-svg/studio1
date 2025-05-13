
"use client";

import type { FC } from 'react';
import type { Draw } from '@/types';
import { AdminDrawCard } from '@/components/admin-draw-card';
import { List } from 'lucide-react';

interface AdminDrawListProps {
  draws: Draw[];
}

export const AdminDrawList: FC<AdminDrawListProps> = ({ draws }) => {
  if (draws.length === 0) {
    return (
      <div className="text-center py-10 bg-card/50 rounded-lg shadow">
        <List size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Nenhum sorteio cadastrado ainda.</p>
        <p className="text-sm text-muted-foreground/80">Use o formulário acima para adicionar o primeiro sorteio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {draws.map(draw => (
        <AdminDrawCard key={draw.id} draw={draw} />
      ))}
    </div>
  );
};
