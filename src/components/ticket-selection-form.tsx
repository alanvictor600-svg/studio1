
"use client";

import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateAutoFilledTicket, countOccurrences, animalMapping } from '@/lib/lottery-utils';
import { NumberButton } from '@/components/number-button';
import { X, Sparkles, Trash2, TicketPlus, PauseCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TicketSelectionFormProps {
  onAddTicket: (numbers: number[]) => void;
  isLotteryActive?: boolean;
}

const MAX_PICKS = 10;
const MAX_REPETITION = 4;

export const TicketSelectionForm: FC<TicketSelectionFormProps> = ({ onAddTicket, isLotteryActive = false }) => {
  const [currentPicks, setCurrentPicks] = useState<number[]>([]);
  const { toast } = useToast();

  const numberCounts = countOccurrences(currentPicks);

  if (isLotteryActive) {
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
              Novas compras de bilhetes estão temporariamente suspensas pois um bolão já foi iniciado.
              Aguarde o administrador reiniciar o bolão para poder comprar novos bilhetes.
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
    setCurrentPicks(generateAutoFilledTicket());
     toast({ title: "Números Gerados!", description: "Seu bilhete foi preenchido automaticamente.", duration: 3000 });
  };

  const handleClearSelection = () => {
    setCurrentPicks([]);
    toast({ title: "Seleção Limpa", description: "Todos os números foram removidos.", duration: 3000 });
  };

  const handleSubmitTicket = () => {
    if (currentPicks.length !== MAX_PICKS) {
      toast({ title: "Seleção Incompleta", description: `Por favor, selecione ${MAX_PICKS} números.`, variant: "destructive" });
      return;
    }
    onAddTicket([...currentPicks].sort((a,b) => a-b)); // Ensure sorted before adding
    setCurrentPicks([]);
    toast({ title: "Bilhete Adicionado!", description: "Boa sorte!", className: "bg-primary text-primary-foreground", duration: 3000 });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
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
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">Escolha os Números (1-25):</h3>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 md:gap-3 p-2 rounded-lg bg-background/30">
            {animalMapping.map(animal => (
              <NumberButton
                key={animal.number}
                number={animal.number}
                onClick={handleNumberClick}
                disabled={(numberCounts[animal.number] || 0) >= MAX_REPETITION || currentPicks.length >= MAX_PICKS}
                isSelected={currentPicks.includes(animal.number)}
                countInSelection={numberCounts[animal.number] || 0}
              />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleAutoFill} className="flex-1 sm:flex-none shadow-md hover:shadow-lg">
            <Sparkles className="mr-2 h-4 w-4" /> Auto-Preencher
          </Button>
          <Button variant="destructive" onClick={handleClearSelection} className="flex-1 sm:flex-none shadow-md hover:shadow-lg">
            <Trash2 className="mr-2 h-4 w-4" /> Limpar
          </Button>
        </div>
        <Button 
          onClick={handleSubmitTicket} 
          disabled={currentPicks.length !== MAX_PICKS}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl text-base py-3 px-6"
        >
          <TicketPlus className="mr-2 h-5 w-5" /> Adicionar Bilhete
        </Button>
      </CardFooter>
    </Card>
  );
};
