
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import type { Ticket, LotteryConfig } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Share2, Copy } from 'lucide-react';
import Image from 'next/image';

interface TicketReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: Ticket | null;
  lotteryConfig: LotteryConfig;
}

export const TicketReceiptDialog: FC<TicketReceiptDialogProps> = ({ isOpen, onOpenChange, ticket, lotteryConfig }) => {
  const { toast } = useToast();

  if (!ticket) {
    return null;
  }

  const receiptText = `
*Comprovante de Aposta - Bolão Potiguar*

*Bilhete ID:* ${ticket.id.substring(0, 8)}
*Comprador:* ${ticket.buyerName || 'N/A'}
*Vendedor:* ${ticket.sellerUsername || 'App Cliente'}
*Data:* ${format(parseISO(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

*Números da Sorte:*
${ticket.numbers.join(' - ')}

*Valor:* R$ ${lotteryConfig.ticketPrice.toFixed(2).replace('.', ',')}

Boa sorte! 🍀
  `.trim();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprovante de Aposta - Bolão Potiguar',
          text: receiptText,
        });
        toast({ title: 'Comprovante compartilhado!' });
      } catch (error) {
        // This is a common case: user closes the share dialog.
        // We check if the error name is 'AbortError' to avoid logging expected behavior.
        if (error instanceof Error && error.name === 'AbortError') {
            toast({ title: 'Compartilhamento cancelado', variant: 'destructive' });
        } else {
            console.error('Erro ao compartilhar:', error);
            toast({ title: 'Ocorreu um erro ao compartilhar', variant: 'destructive' });
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(receiptText);
      toast({
        title: 'API de compartilhamento não suportada',
        description: 'O comprovante foi copiado para a sua área de transferência.',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary flex flex-col items-center gap-4">
             <Image src="/logo.png" alt="Logo" width={80} height={80} />
            Comprovante de Aposta
          </DialogTitle>
        </DialogHeader>

        <div className="my-4 space-y-4 p-4 rounded-lg bg-muted/50 border border-dashed">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">ID do Bilhete:</span>
            <span className="font-mono text-sm font-semibold">#{ticket.id.substring(0, 8)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Comprador:</span>
            <span className="font-semibold">{ticket.buyerName}</span>
          </div>
          {ticket.sellerUsername && (
             <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vendedor:</span>
                <span className="font-semibold">{ticket.sellerUsername}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Data:</span>
            <span className="font-semibold">{format(parseISO(ticket.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor:</span>
            <span className="font-semibold">R$ {lotteryConfig.ticketPrice.toFixed(2).replace('.', ',')}</span>
          </div>

          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-2">Seus Números da Sorte:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {ticket.numbers.map((num, index) => (
                <span key={index} className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg">
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:flex-col gap-3">
          <Button type="button" onClick={handleShare} className="w-full bg-green-600 hover:bg-green-700 text-white">
            <Share2 className="mr-2 h-4 w-4" /> Compartilhar Comprovante
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
