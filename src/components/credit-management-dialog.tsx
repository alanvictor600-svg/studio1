
"use client";

import { useState, useEffect, type FC } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Coins, DollarSign } from 'lucide-react';

interface CreditManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onSave: (user: User, amount: number) => void;
  onClose: () => void;
}

export const CreditManagementDialog: FC<CreditManagementDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  onSave,
  onClose,
}) => {
  const [creditsToAdd, setCreditsToAdd] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setCreditsToAdd(''); // Reset credits field on open
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const handleSave = () => {
    const creditsChange = parseFloat(creditsToAdd);
    if(isNaN(creditsChange) || creditsToAdd.trim() === '' || creditsToAdd === '-') {
      toast({ title: 'Erro de Validação', description: 'O valor do saldo é inválido ou está vazio.', variant: 'destructive' });
      return;
    }
    
    onSave(user, creditsChange);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
    onOpenChange(open);
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números, um sinal de menos no início, e um ponto decimal.
    if (/^-?\d*\.?\d*$/.test(value)) {
        setCreditsToAdd(value);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Saldo de {user.username}</DialogTitle>
          <DialogDescription>
            Adicione ou remova saldo do usuário. Use valores negativos para remover.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center text-center p-4 rounded-lg bg-primary/10">
                <div>
                    <p className="text-sm font-semibold text-primary">Saldo Atual</p>
                    <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                        <Coins className="h-7 w-7"/>
                        <span>R$ {(user.saldo || 0).toFixed(2).replace('.', ',')}</span>
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credits" className="text-right flex flex-col items-end">
                    <span>Saldo</span>
                    <span className="text-xs text-muted-foreground">(+/-)</span>
                </Label>
                <div className="relative col-span-3">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="credits"
                    type="text" // Change to text to allow '-' and '.' properly
                    value={creditsToAdd}
                    onChange={handleInputChange}
                    className="pl-9"
                    placeholder="Ex: 50 para adicionar, -10 para remover"
                    inputMode="decimal"
                />
                </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
