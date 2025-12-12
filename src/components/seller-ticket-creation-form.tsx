
"use client";

import { useState, type FC, useEffect } from 'react';
import type { Ticket } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateAutoFilledTicket, countOccurrences, animalMapping } from '@/lib/lottery-utils';
import { NumberButton } from '@/components/number-button';
import { Sparkles, Trash2, TicketPlus, User, Phone, PauseCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { SelectedNumberBadge } from '@/components/selected-number-badge';
import { useAuth } from '@/context/auth-context';
import { createSellerTicketAction } from '@/app/actions/ticket';
import { InsufficientCreditsDialog } from './insufficient-credits-dialog';
import { TicketReceiptDialog } from './ticket-receipt-dialog';
import { useDashboard } from '@/context/dashboard-context';
import { createPortal } from 'react-dom';


interface SellerTicketCreationFormProps {
  isLotteryPaused?: boolean;
}

const MAX_PICKS = 10;
const MAX_REPETITION = 4;

export const SellerTicketCreationForm: FC<SellerTicketCreationFormProps> = ({ 
  isLotteryPaused = false,
}) => {
  const { currentUser, updateUserBalance } = useAuth();
  const { lotteryConfig } = useDashboard();
  const [currentPicks, setCurrentPicks] = useState<number[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [dialogPortalTarget, setDialogPortalTarget] = useState<Element | null>(null);

  useEffect(() => {
    setDialogPortalTarget(document.getElementById('dialog-portal-root'));
  }, []);

  const numberCounts = countOccurrences(currentPicks);

  if (isLotteryPaused) {
    return (
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-lg shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                <CardTitle className="text-2xl text-center font-bold text-primary">Registrar Venda de Bilhete</CardTitle>
                </CardHeader>
                <CardContent>
                <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground">
                    <PauseCircle className="h-5 w-5 text-primary" />
                    <AlertTitle className="text-primary font-bold">Vendas Pausadas</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                    O registro de novas vendas está suspenso.
                    Aguarde o administrador iniciar um novo ciclo para continuar.
                    </AlertDescription>
                </Alert>
                </CardContent>
            </Card>
        </div>
    );
  }

  const handleNumberClick = (num: number) => {
    if (currentPicks.length >= MAX_PICKS) {
      toast({ title: "Limite Atingido", description: `Você já selecionou ${MAX_PICKS} números.`, variant: "destructive" });
      return;
    }
    if ((numberCounts[num] || 0) >= MAX_REPETITION) {
      toast({ title: "Repetição Máxima", description: `O número ${num} já foi selecionado ${MAX_REPETITION} vezes.`, variant: "destructive" });
      return;
    }
    setCurrentPicks([...currentPicks, num].sort((a, b) => a - b));
  };

  const handleRemoveNumber = (indexToRemove: number) => {
    setCurrentPicks(currentPicks.filter((_, index) => index !== indexToRemove));
  };

  const handleAutoFill = () => {
    setCurrentPicks(generateAutoFilledTicket());
    toast({ title: "Números Gerados!", description: "Os números do bilhete foram preenchidos automaticamente.", duration: 3000 });
  };

  const handleClearSelection = () => {
    setCurrentPicks([]);
    setBuyerName('');
    setBuyerPhone('');
    toast({ title: "Formulário Limpo", description: "Todos os campos foram resetados.", duration: 3000 });
  };

  const handleSubmitTicket = async () => {
    if (!currentUser) {
        toast({ title: "Erro", description: "Vendedor não autenticado.", variant: "destructive" });
        return;
    }
    if (currentPicks.length !== MAX_PICKS) {
      toast({ title: "Seleção Incompleta", description: `Por favor, selecione ${MAX_PICKS} números.`, variant: "destructive" });
      return;
    }
    if (!buyerName.trim()) {
      toast({ title: "Campo Obrigatório", description: "Por favor, insira o nome do comprador.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
        const result = await createSellerTicketAction({
            sellerId: currentUser.id,
            sellerUsername: currentUser.username,
            ticketPicks: currentPicks,
            buyerName: buyerName.trim(),
            buyerPhone: buyerPhone?.trim() || undefined,
        });

        if (result.success && result.createdTicket) {
            toast({ title: "Venda Registrada!", description: "O bilhete foi ativado e o comprovante gerado.", className: "bg-primary text-primary-foreground", duration: 3000 });
            handleClearSelection();
            if (typeof result.newBalance === 'number') {
                updateUserBalance(result.newBalance);
            }
            setReceiptTickets([result.createdTicket]);
        } else if (result.error === 'INSUFFICIENT_FUNDS') {
            setIsCreditsDialogOpen(true);
        } else {
            toast({ title: "Erro ao Vender", description: result.error || "Não foi possível registrar a venda.", variant: "destructive" });
        }
    } catch (e) {
        if (e instanceof Error) {
            toast({ title: "Erro ao Vender", description: e.message || "Ocorreu um erro inesperado.", variant: "destructive" });
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="w-full shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-primary">Registrar Venda de Bilhete</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Escolha 10 números (1-25, até 4 repetições) e insira os dados do comprador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="buyerName" className="text-muted-foreground mb-1 flex items-center">
                <User className="mr-2 h-4 w-4" /> Nome do Comprador
              </Label>
              <Input
                id="buyerName"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nome do Comprador"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="buyerPhone" className="text-muted-foreground mb-1 flex items-center">
                <Phone className="mr-2 h-4 w-4" /> Telefone (Opcional)
              </Label>
              <Input
                id="buyerPhone"
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="(XX) XXXXX-XXXX"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Números Selecionados ({currentPicks.length}/{MAX_PICKS}):</h3>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg min-h-[52px] bg-background/50 items-center justify-center">
              {currentPicks.length === 0 && <span className="text-sm text-muted-foreground">Nenhum número selecionado</span>}
              {currentPicks.map((num, index) => (
                 <SelectedNumberBadge 
                    key={index}
                    number={num}
                    index={index}
                    onRemove={handleRemoveNumber}
                  />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-primary mb-4 text-center">Escolha os Bichos (1-25)</h3>
            <div className="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-10 xl:grid-cols-13 gap-2 md:gap-3 p-2 rounded-lg bg-background/30">
              {animalMapping.map(animal => (
                <NumberButton
                  key={animal.number}
                  number={animal.number}
                  animalName={animal.name}
                  animalEmoji={animal.emoji}
                  onClick={handleNumberClick}
                  disabled={isSubmitting || (numberCounts[animal.number] || 0) >= MAX_REPETITION || currentPicks.length >= MAX_PICKS}
                  isSelected={currentPicks.includes(animal.number)}
                  countInSelection={numberCounts[animal.number] || 0}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleAutoFill} className="flex-1 sm:flex-none shadow-md hover:shadow-lg" disabled={isSubmitting}>
              <Sparkles className="mr-2 h-4 w-4" /> Surpresinha
            </Button>
            <Button variant="destructive" onClick={handleClearSelection} className="flex-1 sm:flex-none shadow-md hover:shadow-lg" disabled={isSubmitting}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpar
            </Button>
          </div>
          <Button 
            onClick={handleSubmitTicket} 
            disabled={isSubmitting || currentPicks.length !== MAX_PICKS || !buyerName.trim()}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl text-base py-3 px-6"
          >
            <TicketPlus className="mr-2 h-5 w-5" /> {isSubmitting ? 'Registrando...' : 'Registrar Venda'}
          </Button>
        </CardFooter>
      </Card>
      <InsufficientCreditsDialog
        isOpen={isCreditsDialogOpen}
        onOpenChange={setIsCreditsDialogOpen}
      />
       {dialogPortalTarget && receiptTickets && createPortal(
          <TicketReceiptDialog
              isOpen={!!receiptTickets}
              onOpenChange={(isOpen) => { if (!isOpen) setReceiptTickets(null); }}
              tickets={receiptTickets}
              lotteryConfig={lotteryConfig}
          />,
          dialogPortalTarget
       )}
    </>
  );
};
