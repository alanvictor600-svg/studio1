
"use client";

import { useState, type FC, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateAutoFilledTicket, countOccurrences, animalMapping } from '@/lib/lottery-utils';
import { NumberButton } from '@/components/number-button';
import { X, Sparkles, Trash2, ShoppingCart, PauseCircle, PlusCircle, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Ticket, User, LotteryConfig } from '@/types';
import { TicketReceiptDialog } from '@/components/ticket-receipt-dialog';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { runTransaction, doc, collection, writeBatch } from 'firebase/firestore';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface TicketSelectionFormProps {
  isLotteryPaused?: boolean;
  currentUser: User | null;
  updateCurrentUserCredits: (newCredits: number) => void;
  lotteryConfig: LotteryConfig;
  initialCart?: number[][];
  onPurchaseComplete?: () => void;
}

const MAX_PICKS = 10;
const MAX_REPETITION = 4;

export const TicketSelectionForm: FC<TicketSelectionFormProps> = ({ 
  isLotteryPaused = false,
  currentUser,
  updateCurrentUserCredits,
  lotteryConfig,
  initialCart,
  onPurchaseComplete,
}) => {
  const [currentPicks, setCurrentPicks] = useState<number[]>([]);
  const [cart, setCart] = useState<number[][]>([]);
  const { toast } = useToast();
  const [receiptTicket, setReceiptTicket] = useState<Ticket | null>(null);
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCart && initialCart.length > 0) {
      setCart(prevCart => [...prevCart, ...initialCart]);
      onPurchaseComplete?.(); // Clear the trigger state in parent
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCart]);


  const numberCounts = countOccurrences(currentPicks);

  if (isLotteryPaused) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-primary">Monte Seu Bilhete</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground">
            <PauseCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">Compras Pausadas</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Novas compras estão suspensas pois a loteria já começou ou há um bilhete premiado.
              Aguarde o administrador iniciar uma nova loteria.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
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
    const newTicket = generateAutoFilledTicket();
    setCart(prevCart => [...prevCart, newTicket]);
    toast({ title: "Surpresinha Adicionada!", description: "Um bilhete com números aleatórios foi adicionado ao seu carrinho.", duration: 3000 });
  };
  
  const handleAddTicketToCart = () => {
    if (currentPicks.length !== MAX_PICKS) {
      toast({ title: "Seleção Incompleta", description: `Por favor, selecione ${MAX_PICKS} números para adicionar ao carrinho.`, variant: "destructive" });
      return;
    }
    setCart(prevCart => [...prevCart, currentPicks]);
    setCurrentPicks([]);
    toast({ title: "Bilhete Adicionado ao Carrinho", description: "Sua seleção está pronta para ser comprada.", duration: 3000 });
  };

  const handleRemoveFromCart = (indexToRemove: number) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const handleClearSelection = () => {
    setCurrentPicks([]);
    toast({ title: "Seleção Limpa", description: "Todos os números foram removidos.", duration: 3000 });
  };

  const handlePurchaseCart = async () => {
    if (!currentUser) {
        toast({ title: "Erro", description: "Você precisa estar logado para comprar.", variant: "destructive" });
        return;
    }
    if (cart.length === 0) {
      toast({ title: "Carrinho Vazio", description: "Adicione pelo menos um bilhete ao carrinho para comprar.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const totalCost = cart.length * lotteryConfig.ticketPrice;

    try {
      const userRef = doc(db, "users", currentUser.id);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User not found.");
        }

        const currentBalance = userDoc.data().saldo || 0;
        if (currentBalance < totalCost) {
          throw new Error("Insufficient credits.");
        }
        
        const newBalance = currentBalance - totalCost;
        
        const batch = writeBatch(db);
        cart.forEach(ticketNumbers => {
            const newTicketRef = doc(collection(db, "tickets"));
            const newTicketData: Ticket = {
            id: newTicketRef.id,
            numbers: ticketNumbers.sort((a,b) => a-b),
            status: 'active',
            createdAt: new Date().toISOString(),
            buyerName: currentUser.username,
            buyerId: currentUser.id,
            };
            batch.set(newTicketRef, newTicketData);
        });

        // This is a bit of a hack as we can't commit batch inside a transaction.
        // We'll commit it after. The transaction is just for the balance check.
        transaction.update(userRef, { saldo: newBalance });
        await batch.commit();
      });
      
      // Update local state for immediate feedback
      updateCurrentUserCredits((currentUser.saldo || 0) - totalCost);
      
      toast({ 
          title: `Compra Realizada! (${cart.length} bilhete${cart.length > 1 ? 's' : ''})`, 
          description: `Boa sorte! Seus bilhetes estão em "Meus Bilhetes".`, 
          className: "bg-primary text-primary-foreground", 
          duration: 4000 
      });

      setCart([]);
      onPurchaseComplete?.();

    } catch (e: any) {
      console.error("Transaction failed: ", e);
      if (e.message === 'Insufficient credits.') {
        setIsCreditsDialogOpen(true);
      } else {
        toast({ title: "Erro na Compra", description: e.message || "Não foi possível registrar seus bilhetes.", variant: "destructive" });
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  const totalCost = cart.length * lotteryConfig.ticketPrice;

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-primary">Monte Seu Bilhete</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Escolha 10 números de 1 a 25. Você pode repetir um número até 4 vezes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Números Selecionados ({currentPicks.length}/{MAX_PICKS}):</h3>
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg min-h-[52px] bg-background/50 items-center justify-center">
              {currentPicks.length === 0 && <span className="text-sm text-muted-foreground">Nenhum número selecionado</span>}
              {currentPicks.map((num, index) => (
                <Badge key={index} variant="secondary" className="text-base relative pr-7 shadow-sm">
                  {num}
                  <button
                    onClick={() => handleRemoveNumber(index)}
                    className="absolute top-1/2 right-1 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-secondary-foreground/20"
                    aria-label={`Remover número ${num}`}
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
             <div className="flex gap-2 mt-2">
                <Button variant="destructive" size="sm" onClick={handleClearSelection} className="flex-1 shadow-sm" disabled={isSubmitting || currentPicks.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Limpar Seleção
                </Button>
                <Button onClick={handleAddTicketToCart} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm" disabled={isSubmitting || currentPicks.length !== MAX_PICKS}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar ao Carrinho
                </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">Escolha os Bichos (1-25):</h3>
            <div className="grid grid-cols-5 md:grid-cols-7 gap-2 md:gap-3 p-2 rounded-lg bg-background/30">
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

          <Separator />

          <div>
             <h3 className="text-lg font-bold text-muted-foreground mb-4 text-center flex items-center justify-center gap-2">
                <ShoppingCart /> Carrinho de Apostas ({cart.length})
             </h3>
             {cart.length > 0 ? (
                <ScrollArea className="h-48 border rounded-lg bg-background/50 p-4">
                    <div className="space-y-3">
                        {cart.map((ticketNumbers, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <p className="text-sm font-semibold">Bilhete {index + 1}:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {ticketNumbers.map((num, i) => (
                                        <Badge key={i} variant="outline" className="font-mono text-xs">{num}</Badge>
                                    ))}
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemoveFromCart(index)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
             ) : (
                <div className="text-center text-sm text-muted-foreground p-6 border-2 border-dashed rounded-lg">
                    <p>Seu carrinho está vazio.</p>
                    <p>Adicione bilhetes manuais ou surpresinhas para comprar.</p>
                </div>
             )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
            <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleAutoFill} className="flex-1 sm:flex-none shadow-md hover:shadow-lg" disabled={isSubmitting}>
                    <Sparkles className="mr-2 h-4 w-4" /> Add Surpresinha
                </Button>
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold">Total:</p>
                <p className="text-2xl font-bold text-primary">R$ {totalCost.toFixed(2).replace('.', ',')}</p>
            </div>
            <Button 
                onClick={handlePurchaseCart} 
                disabled={cart.length === 0 || isSubmitting}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl text-lg h-12"
            >
                {isSubmitting ? 'Comprando...' : 'Comprar Carrinho'}
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </CardFooter>
      </Card>
      
      <InsufficientCreditsDialog
        isOpen={isCreditsDialogOpen}
        onOpenChange={setIsCreditsDialogOpen}
      />
    </>
  );
};
