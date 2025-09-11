
"use client";

import type { FC } from 'react';
import { useRef } from 'react';
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
import { Printer, Share2, Copy } from 'lucide-react';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { Separator } from '@/components/ui/separator';

interface TicketReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ticket: Ticket | null;
  lotteryConfig: LotteryConfig;
}

const ReceiptContent: FC<{ ticket: Ticket; lotteryConfig: LotteryConfig }> = ({ ticket, lotteryConfig }) => (
  <div className="bg-white text-black font-mono p-6 max-w-sm mx-auto rounded-lg shadow-lg border-2 border-dashed border-gray-400">
    <div className="text-center mb-4">
      <Image src="/logo.png" alt="Logo" width={80} height={80} className="mx-auto" />
      <h2 className="text-2xl font-bold mt-2">Bolão Potiguar</h2>
      <p className="text-sm">Comprovante de Aposta</p>
    </div>

    <Separator className="my-4 border-dashed bg-gray-400" />

    <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span>Data/Hora:</span> <span>{format(parseISO(ticket.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}</span></div>
      <div className="flex justify-between"><span>Bilhete ID:</span> <span>#{ticket.id.substring(0, 8)}</span></div>
      <div className="flex justify-between"><span>Comprador:</span> <span className="font-bold">{ticket.buyerName}</span></div>
      {ticket.sellerUsername && (
        <div className="flex justify-between"><span>Vendedor:</span> <span>{ticket.sellerUsername}</span></div>
      )}
    </div>

    <Separator className="my-4 border-dashed bg-gray-400" />

    <p className="text-center text-sm uppercase tracking-widest mb-2">Seus Números da Sorte</p>
    <div className="grid grid-cols-5 gap-2 text-center">
      {ticket.numbers.map((num, index) => (
        <span key={index} className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-200 font-bold text-lg shadow-inner">
          {num.toString().padStart(2, '0')}
        </span>
      ))}
    </div>

    <Separator className="my-4 border-dashed bg-gray-400" />

    <div className="space-y-2 text-sm">
      <div className="flex justify-between font-bold text-base">
        <span>Valor Pago:</span>
        <span>R$ {lotteryConfig.ticketPrice.toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
    
    <div className="text-center mt-6">
      <p className="font-bold text-sm">Boa Sorte! 🍀</p>
      <p className="text-xs mt-1">Guarde este comprovante.</p>
    </div>
  </div>
);


export const TicketReceiptDialog: FC<TicketReceiptDialogProps> = ({ isOpen, onOpenChange, ticket, lotteryConfig }) => {
  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Comprovante-BolaoPotiguar-${ticket?.id.substring(0, 8)}`,
    onAfterPrint: () => toast({ title: 'Impressão concluída!' }),
    onPrintError: () => toast({ title: 'Ocorreu um erro ao imprimir', variant: 'destructive' }),
  });


  if (!ticket) {
    return null;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">
            Comprovante Gerado
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="my-4">
          <ReceiptContent ticket={ticket} lotteryConfig={lotteryConfig} />
        </div>

        <DialogFooter className="sm:flex-col gap-3">
          <Button type="button" onClick={handlePrint} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Imprimir ou Salvar PDF
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

