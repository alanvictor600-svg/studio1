

"use client";

import { useState } from 'react';
import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Rocket, AlertTriangle, KeyRound, Eye, EyeOff } from 'lucide-react';

interface ControlsSectionProps {
  onStartNewLottery: () => Promise<void>;
}

export const ControlsSection: FC<ControlsSectionProps> = ({ onStartNewLottery }) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [startLotteryPassword, setStartLotteryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleStartLottery = async () => {
    const CONTROL_PASSWORD = "Al@n2099";
    if (startLotteryPassword !== CONTROL_PASSWORD) {
      toast({ title: "Ação Bloqueada", description: "Senha de controle incorreta.", variant: "destructive" });
      return;
    }
    
    await onStartNewLottery();

    setStartLotteryPassword('');
    setIsConfirmDialogOpen(false); 
  };
  
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset state when dialog closes
      setStartLotteryPassword('');
      setShowPassword(false);
    }
    setIsConfirmDialogOpen(open);
  }

  return (
    <section aria-labelledby="lottery-controls-heading">
      <h2 id="lottery-controls-heading" className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center flex items-center justify-center">
        <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
        Controles da Loteria
      </h2>
      <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl text-center font-semibold">
            Iniciar Nova Loteria
          </CardTitle>
           <CardDescription className="text-center text-muted-foreground">
            Esta ação reinicia a loteria, cria um histórico e expira bilhetes ativos. Use com cuidado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={handleDialogChange}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="text-base py-3 px-6 shadow-lg hover:shadow-xl bg-accent hover:bg-accent/90 text-accent-foreground">
                <Rocket className="mr-2 h-5 w-5" /> Iniciar Nova Loteria
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                  Confirmar Nova Loteria?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá salvar um resumo do ciclo de vendas atual, limpar todos os sorteios existentes e marcar todos os bilhetes ativos, premiados e aguardando pagamento como 'expirados'. Esta ação não pode ser desfeita.
                  <br/><br/>
                  <span className="font-bold text-foreground">Digite a senha de controle para confirmar.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                  <Label htmlFor="control-password" className="sr-only">
                    Senha de Controle
                  </Label>
                  <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                      id="control-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha de Controle"
                      value={startLotteryPassword}
                      onChange={(e) => setStartLotteryPassword(e.target.value)}
                      className="pl-9 pr-10"
                      />
                      <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                      >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                  </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleStartLottery} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Confirmar e Iniciar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </section>
  );
};

    