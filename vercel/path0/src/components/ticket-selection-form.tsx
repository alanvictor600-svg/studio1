
"use client";

import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { generateAutoFilledTicket, countOccurrences, animalMapping } from '@/lib/lottery-utils';
import { NumberButton } from '@/components/number-button';
import { X, Sparkles, Trash2, PauseCircle, PlusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { SelectedNumberBadge } from '@/components/selected-number-badge';

interface TicketSelectionFormProps {
  cart: number[][];
  onCartChange: (cart: number[][]) => void;
  isSubmitting: boolean;
}

const MAX_PICKS = 10;
const MAX_REPETITION = 4;

export const TicketSelectionForm: FC<TicketSelectionFormProps> = ({ 
  cart,
  onCartChange,
  isSubmitting
}) => {
  const [currentPicks, setCurrentPicks] = useState<number[]>([]);
  const { toast } = useToast();

  const numberCounts = countOccurrences(currentPicks);

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
    toast({ title: "Surpresinha Gerada!", description: "Confira os números e adicione ao carrinho para comprar.", duration: 3000 });
  };
  
  const handleAddTicketToCart = () => {
    if (currentPicks.length !== MAX_PICKS) {
      toast({ title: "Seleção Incompleta", description: `Por favor, selecione ${MAX_PICKS} números para adicionar ao carrinho.`, variant: "destructive" });
      return;
    }
    onCartChange([...cart, currentPicks]);
    setCurrentPicks([]);
    toast({ title: "Bilhete Adicionado ao Carrinho", description: "Sua seleção está pronta para ser comprada.", duration: 3000 });
  };

  const handleClearSelection = () => {
    setCurrentPicks([]);
    toast({ title: "Seleção Limpa", description: "Todos os números foram removidos.", duration: 3000 });
  };

  return (
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
              <SelectedNumberBadge 
                key={index}
                number={num}
                index={index}
                onRemove={handleRemoveNumber}
              />
            ))}
          </div>
           <div className="flex justify-between mt-4 gap-2">
                <Button variant="destructive" onClick={handleClearSelection} className="w-full shadow-md hover:shadow-lg" disabled={isSubmitting || currentPicks.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Limpar Seleção
                </Button>
                <Button onClick={handleAddTicketToCart} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl text-base py-3" disabled={isSubmitting || currentPicks.length !== MAX_PICKS}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Adicionar ao Carrinho
                </Button>
            </div>
             <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" onClick={handleAutoFill} className="shadow-sm" disabled={isSubmitting}>
                <Sparkles className="mr-2 h-4 w-4" /> Surpresinha
              </Button>
            </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-primary mb-4 text-center">Escolha os Bichos (1-25)</h3>
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
      </CardContent>
    </Card>
  );
};
