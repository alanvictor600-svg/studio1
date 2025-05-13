
"use client";

import { useState, useEffect } from 'react';
import type { Draw } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { AdminDrawForm } from '@/components/admin-draw-form';
import { AdminDrawList } from '@/components/admin-draw-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedDraws = localStorage.getItem('bolaoPotiguarDraws');
    if (storedDraws) {
      setDraws(JSON.parse(storedDraws));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('bolaoPotiguarDraws', JSON.stringify(draws));
    }
  }, [draws, isClient]);

  const handleAddDraw = (newNumbers: number[]) => {
    if (newNumbers.length !== 5) {
      // This should be handled by the form, but as a safeguard
      alert("O sorteio deve conter exatamente 5 números.");
      return;
    }
    const newDraw: Draw = {
      id: uuidv4(),
      numbers: newNumbers.sort((a, b) => a - b),
      status: 'registered', // Default status, can be extended later
      createdAt: new Date().toISOString(),
    };
    setDraws(prevDraws => [newDraw, ...prevDraws]);
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Carregando Admin...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="mb-10">
        <div className="flex justify-between items-center">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>
          <div className="text-center flex-grow">
             <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight">
                Área Administrativa
             </h1>
             <p className="text-lg text-muted-foreground mt-2">Cadastro de Sorteios Manuais (5 Números)</p>
          </div>
          <div className="w-[150px]"></div> {/* Spacer to balance the layout */}
        </div>
      </header>

      <main className="space-y-12 flex-grow">
        <section aria-labelledby="draw-submission-heading">
          <h2 id="draw-submission-heading" className="sr-only">Cadastrar Novo Sorteio</h2>
          <AdminDrawForm onAddDraw={handleAddDraw} />
        </section>

        <section aria-labelledby="draw-history-heading" className="mt-16">
          <h2 id="draw-history-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">
            Histórico de Sorteios
          </h2>
          <AdminDrawList draws={draws} />
        </section>
      </main>

      <footer className="mt-20 py-8 text-center border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bolão Potiguar - Admin.
        </p>
      </footer>
    </div>
  );
}
