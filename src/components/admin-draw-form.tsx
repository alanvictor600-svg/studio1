
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, RotateCcw, LockKeyhole, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminDrawFormProps {
  onAddDraw: (numbers: number[]) => void;
  hasWinningTickets?: boolean;
}

const NUM_OF_PICKS = 5;
const MIN_NUMBER = 1;
const MAX_NUMBER = 25;

export const AdminDrawForm: FC<AdminDrawFormProps> = ({ onAddDraw, hasWinningTickets }) => {
  const [numbers, setNumbers] = useState<string[]>(Array(NUM_OF_PICKS).fill(''));
  const { toast } = useToast();

  const handleInputChange = (index: number, value: string) => {
    const newNumbers = [...numbers];
    // Allow only numeric input, or empty string for clearing
    if (/^\d*$/.test(value)) {
      newNumbers[index] = value;
      setNumbers(newNumbers);
    }
  };

  const validateAndSubmit = () => {
    if (hasWinningTickets) {
      toast({ title: "Ação Bloqueada", description: "Não é possível cadastrar sorteios enquanto houver bilhetes premiados. Inicie uma nova loteria.", variant: "destructive" });
      return;
    }

    const parsedNumbers: number[] = [];
    for (let i = 0; i < NUM_OF_PICKS; i++) {
      const numStr = numbers[i];
      if (numStr === '') {
        toast({ title: "Erro de Validação", description: `O número ${i + 1} não pode estar vazio.`, variant: "destructive" });
        return;
      }
      const num = parseInt(numStr, 10);
      if (isNaN(num) || num < MIN_NUMBER || num > MAX_NUMBER) {
        toast({ title: "Erro de Validação", description: `Número ${i + 1} inválido. Deve ser entre ${MIN_NUMBER} e ${MAX_NUMBER}.`, variant: "destructive" });
        return;
      }
      parsedNumbers.push(num);
    }

    if (parsedNumbers.length === NUM_OF_PICKS) {
      onAddDraw(parsedNumbers);
      setNumbers(Array(NUM_OF_PICKS).fill('')); // Clear form
      // Toast for successful draw registration is handled in the parent page
    }
  };

  const handleClear = () => {
    setNumbers(Array(NUM_OF_PICKS).fill(''));
    toast({ title: "Campos Limpos", description: "Os números foram removidos." });
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className={`text-xl text-center font-bold ${hasWinningTickets ? 'text-foreground' : 'text-primary'}`}>
          {hasWinningTickets ? (
            <span className="flex items-center justify-center"><LockKeyhole className="mr-2 h-5 w-5" /> Cadastro de Sorteio Bloqueado</span>
          ) : (
            'Cadastrar Novo Sorteio'
          )}
        </CardTitle>
        {!hasWinningTickets && (
          <CardDescription className="text-center text-muted-foreground">
            Insira {NUM_OF_PICKS} números (podem ser repetidos) entre {MIN_NUMBER} e {MAX_NUMBER}.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {hasWinningTickets ? (
          <Alert variant="destructive" className="border-destructive/70 bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="font-semibold text-foreground">Cadastro de Sorteios Interrompido</AlertTitle>
            <AlertDescription className="text-foreground/90">
              Existem bilhetes premiados aguardando o encerramento da loteria atual.
              Para registrar novos sorteios, por favor, inicie uma nova loteria na seção 'Controles da Loteria'.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {numbers.map((num, index) => (
              <Input
                key={index}
                type="number"
                value={num}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder={`${index + 1}º`}
                min={MIN_NUMBER}
                max={MAX_NUMBER}
                className="text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label={`Número ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
      {!hasWinningTickets && (
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
           <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto shadow-md hover:shadow-lg">
              <RotateCcw className="mr-2 h-4 w-4" /> Limpar Campos
            </Button>
          <Button 
            onClick={validateAndSubmit} 
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl text-base py-3 px-6"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Sorteio
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

