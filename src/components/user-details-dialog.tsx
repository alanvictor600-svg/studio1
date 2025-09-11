
"use client";

import { useState, type FC, forwardRef } from 'react';
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
import { Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface UserDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onDelete: () => void;
  onClose: () => void;
}

export const UserDetailsDialog: FC<UserDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  onDelete,
  onClose,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return null;
  }
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsPasswordVisible(false); // Hide password when closing
      onClose();
    }
    onOpenChange(open);
  }

  const handleDeleteClick = () => {
    onDelete();
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Senha copiada!",
        className: "bg-primary text-primary-foreground",
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
          <DialogDescription>
            Visualize as informações do usuário para recuperação ou exclua a conta.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="username">Usuário</Label>
            <p id="username" className="font-semibold text-foreground p-2 bg-muted rounded-md">{user.username}</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
                 <Input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    readOnly
                    value={user.passwordHash}
                    className="pr-20"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyToClipboard(user.passwordHash)}>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsPasswordVisible(prev => !prev)}>
                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{isPasswordVisible ? 'Esconder senha' : 'Mostrar senha'}</span>
                    </Button>
                </div>
            </div>
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
        <DialogFooter className="justify-between sm:justify-between">
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

