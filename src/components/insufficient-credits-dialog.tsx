
"use client";

import type { FC } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coins, DollarSign } from 'lucide-react';

interface InsufficientCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const InsufficientCreditsDialog: FC<InsufficientCreditsDialogProps> = ({ isOpen, onOpenChange }) => {
  const router = useRouter();

  const handleRedirect = () => {
    router.push('/solicitar-saldo');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-center">
           <DollarSign className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <AlertDialogTitle className="text-2xl">Quase lá! Adicione saldo para continuar</AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground pt-2">
            Sua sorte está a um passo! Adicione mais saldo agora para não perder a chance de ganhar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">Fechar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRedirect} className="w-full sm:w-auto bg-green-500 text-white hover:bg-green-600">
            <Coins className="mr-2 h-4 w-4" /> Adquirir Saldo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

    


