"use client";

import { useState, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateAutoFilledTicket, countOccurrences, animalMapping } from '@/lib/lottery-utils';
import { NumberButton } from '@/components/number-button';
import { X, Sparkles, Trash2, TicketPlus, User, Phone, PauseCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SellerTicketCreationFormProps {
  onAddTicket: (numbers: number[], buyerName: string, buyerPhone: string) => void;
  isLotteryActive?: boolean;
}

const MAX_PICKS = 10;
const MAX_REPETITION = 4;

export const SellerTicketCreationForm: FC<SellerTicketCreationFormProps> = ({ onAddTicket, isLotteryActive = false }) => {
  const [currentPicks, setCurrentPicks] = useState<number[]>([]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const { toast } = useToast();

  const numberCounts = countOccurrences(currentPicks);

  if (isLotteryActive) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-primary">Registrar Venda de Bilhete</CardTitle>
        </CardHeader>
        <CardContent>
           <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground">
            <PauseCircle className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">Vendas Pausadas</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              O registro de novas vendas de bilhetes está temporariamente suspenso pois um bolão já foi iniciado.
              Aguarde o administrador reiniciar o bolão para registrar novas vendas.
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
    toast({ title: "Números Gerados!", description: "Os números do bilhete foram preenchidos automaticamente." });
  };

  const handleClearSelection = () => {
    setCurrentPicks([]);
    toast({ title: "Seleção Limpa", description: "Todos os números foram removidos." });
  };

  const handleSubmitTicket = () => {
    if (currentPicks.length !== MAX_PICKS) {
      toast({ title: "Seleção Incompleta", description: `Por favor, selecione ${MAX_PICKS} números.`, variant: "destructive" });
      return;
    }
    if (!buyerName.trim()) {
      toast({ title: "Campo Obrigatório", description: "Por favor, insira o nome do comprador.", variant: "destructive" });
      return;
    }
    // Phone is optional for now, can add more complex validation later
    onAddTicket([...currentPicks].sort((a,b) => a-b), buyerName, buyerPhone);
    setCurrentPicks([]);
    setBuyerName('');
    setBuyerPhone('');
    toast({ title: "Bilhete Vendido Adicionado!", description: "O bilhete foi registrado com sucesso.", className: "bg-primary text-primary-foreground" });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
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
              className="bg-background/50"
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
              className="bg-background/50"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Números Selecionados ({currentPicks.length}/{MAX_PICKS}):</h3>
          <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg min-h-[52px] bg-background/50 items-center justify-center">
            {currentPicks.length === 0 && <span className="text-sm text-muted-foreground">Nenhum número selecionado</span>}
            {currentPicks.map((num, index) => (
              <Badge key={index} variant="secondary" className="text-base relative pr-7 shadow-sm bg-primary text-primary-foreground">
                {num}
                <button
                  onClick={() => handleRemoveNumber(index)}
                  className="absolute top-1/2 right-1 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-primary-foreground/20"
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
                animalName={animal.name}
                animalImageHint={animal.hint}
              />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleAutoFill} className="flex-1 sm:flex-none shadow-md hover:shadow-lg">
            <Sparkles className="mr-2 h-4 w-4" /> Auto-Preencher Números
          </Button>
          <Button variant="destructive" onClick={handleClearSelection} className="flex-1 sm:flex-none shadow-md hover:shadow-lg">
            <Trash2 className="mr-2 h-4 w-4" /> Limpar Números
          </Button>
        </div>
        <Button 
          onClick={handleSubmitTicket} 
          disabled={currentPicks.length !== MAX_PICKS || !buyerName.trim()}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl text-base py-3 px-6"
        >
          <TicketPlus className="mr-2 h-5 w-5" /> Registrar Venda
        </Button>
      </CardFooter>
    </Card>
  );
};
