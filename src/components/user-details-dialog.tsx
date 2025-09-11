
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, KeyRound, Ticket as TicketIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const userActiveTickets = useMemo(() => {
    if (!user) return [];
    return allTickets.filter(ticket => 
        ticket.status === 'active' && 
        (ticket.buyerName === user.username || ticket.sellerUsername === user.username)
    );
  }, [user, allTickets]);

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
            Visualize informações, bilhetes ativos e gerencie a conta do usuário.
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
                        <Badge variant={user.role === 'vendedor' ? 'secondary' : 'outline'}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-2">
                <h3 className="font-semibold flex items-center">
                    <TicketIcon className="mr-2 h-5 w-5 text-primary"/>
                    Bilhetes Ativos ({userActiveTickets.length})
                </h3>
                {userActiveTickets.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-3 bg-background/50 max-h-48 overflow-y-auto">
                        {userActiveTickets.map(ticket => (
                            <div key={ticket.id} className="text-sm p-2 bg-muted rounded-md">
                                <p className="font-mono text-xs text-muted-foreground">ID: #{ticket.id.substring(0, 6)}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {ticket.numbers.map((num, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">{num}</Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    {format(parseISO(ticket.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-md">
                        Nenhum bilhete ativo encontrado para este usuário.
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

    
