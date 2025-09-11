
"use client";

import { useState, useEffect, type FC, forwardRef } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onSave: (updatedUser: User) => void;
  onDelete: () => void;
  onClose: () => void;
}

// forwardRef is needed for react-to-print to work with shadcn dialogs
const CustomDialogFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <DialogFooter {...props} ref={ref} />
));
CustomDialogFooter.displayName = 'CustomDialogFooter';


export const UserEditDialog: FC<UserEditDialogProps> = ({
  isOpen,
  onOpenChange,
  user,
  onSave,
  onDelete,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cliente' | 'vendedor'>('cliente');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      setRole(user.role);
      setPassword(''); // Reset password field on open
    }
  }, [isOpen, user]);

  if (!user) {
    return null;
  }

  const handleSave = () => {
    if (!username.trim()) {
      toast({ title: 'Erro de Validação', description: 'O nome de usuário não pode estar vazio.', variant: 'destructive' });
      return;
    }
    
    // In our simplified system, passwordHash stores the plain text password.
    // If a new password is provided, use it. Otherwise, keep the existing one.
    const newPasswordHash = password.trim() ? password.trim() : user.passwordHash;

    const updatedUser: User = {
      ...user,
      username: username.trim(),
      role: role,
      passwordHash: newPasswordHash, // Update the password hash field
    };
    onSave(updatedUser);
  };
  
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Faça alterações nos dados do usuário aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Usuário
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Nova Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder="Deixe em branco para manter a atual"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Perfil</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as 'cliente' | 'vendedor')}
              className="col-span-3 flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cliente" id="role-cliente" />
                <Label htmlFor="role-cliente">Cliente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vendedor" id="role-vendedor" />
                <Label htmlFor="role-vendedor">Vendedor</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <CustomDialogFooter className="justify-between sm:justify-between">
            <Button type="button" variant="destructive" onClick={handleDeleteClick} className="mr-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
            </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </CustomDialogFooter>
      </DialogContent>
    </Dialog>
  );
};
