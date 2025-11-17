
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { User, ShoppingCart as SellerIcon } from 'lucide-react';

interface RoleSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRoleSelect: (role: 'cliente' | 'vendedor') => void;
}

export const RoleSelectionDialog: FC<RoleSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  onRoleSelect,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Complete seu Cadastro</DialogTitle>
          <DialogDescription className="text-center">
            Bem-vindo! Para continuar, escolha o tipo de conta que você deseja criar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="h-28 flex flex-col gap-2"
            onClick={() => onRoleSelect('cliente')}
          >
            <User className="h-8 w-8 text-primary" />
            <span className="font-semibold">Sou um Cliente</span>
            <p className="text-xs text-muted-foreground font-normal">Quero fazer apostas</p>
          </Button>
          <Button
            variant="outline"
            className="h-28 flex flex-col gap-2"
            onClick={() => onRoleSelect('vendedor')}
          >
            <SellerIcon className="h-8 w-8 text-accent" />
            <span className="font-semibold">Sou um Vendedor</span>
             <p className="text-xs text-muted-foreground font-normal">Quero vender bilhetes</p>
          </Button>
        </div>
        <DialogFooter className="justify-center">
          <p className="text-xs text-muted-foreground">Esta escolha é permanente para esta conta.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
