
"use client";

import { useState, type FC, useMemo } from 'react';
import type { User, Ticket } from '@/types';
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
import { Trash2, Ticket as TicketIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Label } from '@/components/ui/label';

interface UserDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  allTickets: Ticket[];
  onDelete: () => void;
  onClose: () => void;
}

export const UserDetailsDialog: FC<UserDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  allTickets,
  onDelete,
  onClose,
}) => {

  const userTickets = useMemo(() => {
    if (!user) return { active: [], winning: [], expired: [], unpaid: [] };
    const idField = user.role === 'cliente' ? 'buyerId' : 'sellerId';
    
    return {
        active: allTickets.filter(t => t.status === 'active' && t[idField] === user.id),
        winning: allTickets.filter(t => t.status === 'winning' && t[idField] === user.id),
        expired: allTickets.filter(t => t.status === 'expired' && t[idField] === user.id),
        unpaid: allTickets.filter(t => t.status === 'unpaid' && t[idField] === user.id),
    };
  }, [user, allTickets]);
  
  const totalTickets = Object.values(userTickets).reduce((sum, arr) => sum + arr.length, 0);

  if (!user) {
    return null;
  }
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
    onOpenChange(open);
  }

  const handleDeleteClick = () => {
    onDelete();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes de {user.username}</DialogTitle>
          <DialogDescription>
            Visualize informações e o histórico de bilhetes do usuário.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-6 py-4">
            <div className="space-y-4">
                 <div className="space-y-1">
                    <Label htmlFor="username">Usuário</Label>
                    <p id="username" className="font-semibold text-foreground p-2 bg-muted rounded-md">{user.username}</p>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="role">Perfil</Label>
                    <div id="role">
                        <Badge variant={user.role === 'vendedor' ? 'secondary' : (user.role === 'admin' ? 'destructive' : 'outline')}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="font-semibold flex items-center">
                    <TicketIcon className="mr-2 h-5 w-5 text-primary"/>
                    Resumo de Bilhetes ({totalTickets})
                </h3>
                {totalTickets > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ativos:</span>
                            <Badge variant="secondary">{userTickets.active.length}</Badge>
                        </div>
                         <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Premiados:</span>
                            <Badge className="bg-accent text-accent-foreground">{userTickets.winning.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Não Pagos:</span>
                            <Badge variant="destructive">{userTickets.unpaid.length}</Badge>
                        </div>
                         <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Expirados:</span>
                            <Badge variant="outline">{userTickets.expired.length}</Badge>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-md">
                        Nenhum bilhete associado a este usuário.
                    </p>
                )}
            </div>
            </div>
        </ScrollArea>
        <DialogFooter className="justify-between sm:justify-between pt-4 border-t">
            <Button type="button" variant="destructive" onClick={handleDeleteClick} className="mr-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Fechar
              </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
