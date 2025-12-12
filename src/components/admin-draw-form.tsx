
"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, RotateCcw, LockKeyhole, AlertTriangle, Edit3, CheckCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface AdminDrawFormProps {
  onAddDraw: (numbers: number[], name?: string) => void;
  hasWinningTickets?: boolean;
}

const MIN_NUMBER = 1;
const MAX_NUMBER = 25;

export const AdminDrawForm: FC<AdminDrawFormProps> = ({ onAddDraw, hasWinningTickets }) => {
  const [numberOfPicks, setNumberOfPicks] = useState<5 | 10>(10);
  const [numbers, setNumbers] = useState<string[]>(Array(10).fill(''));
  const [confirmNumbers, setConfirmNumbers] = useState<string[]>(Array(10).fill(''));
  const [drawName, setDrawName] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleNumberOfPicksChange = (value: string) => {
    const newSize = parseInt(value, 10) as 5 | 10;
    setNumberOfPicks(newSize);
    setNumbers(Array(newSize).fill(''));
    setConfirmNumbers(Array(newSize).fill(''));
  };

  const handleInputChange = (index: number, value: string) => {
    const newNumbers = [...numbers];
    if (/^\d*$/.test(value)) {
      newNumbers[index] = value;
      setNumbers(newNumbers);
    }
  };

  const handleConfirmInputChange = (index: number, value: string) => {
    const newConfirm = [...confirmNumbers];
    if (/^\d*$/.test(value)) {
      newConfirm[index] = value;
      setConfirmNumbers(newConfirm);
    }
  };

  const areNumbersFilled = useMemo(() => {
    for (let i = 0; i < numberOfPicks; i++) {
        if (numbers[i] === '') {
            return false;
        }
    }
    return true;
  }, [numbers, numberOfPicks]);

  const areConfirmNumbersMatching = useMemo(() => {
    for (let i = 0; i < numberOfPicks; i++) {
        if (numbers[i] === '' || confirmNumbers[i] === '' || numbers[i] !== confirmNumbers[i]) {
            return false;
        }
    }
    return true;
  }, [numbers, confirmNumbers, numberOfPicks]);


  const validateAndSubmit = () => {
    if (!areConfirmNumbersMatching) {
        toast({ title: "Erro de Confirmação", description: "Os números da contra-prova não coincidem com os originais.", variant: "destructive" });
        return;
    }

    const parsedNumbers: number[] = [];
    for (let i = 0; i < numberOfPicks; i++) {
      const numStr = numbers[i];
      const num = parseInt(numStr, 10);
      if (isNaN(num) || num < MIN_NUMBER || num > MAX_NUMBER) {
        toast({ title: "Erro de Validação", description: `Número ${i + 1} inválido. Deve ser entre ${MIN_NUMBER} e ${MAX_NUMBER}.`, variant: "destructive" });
        return;
      }
      parsedNumbers.push(num);
    }

    if (parsedNumbers.length === numberOfPicks) {
      onAddDraw(parsedNumbers, drawName ? drawName.trim() : undefined);
      handleClear();
      setIsConfirmDialogOpen(false);
    }
  };

  const handleClear = () => {
    setNumbers(Array(numberOfPicks).fill(''));
    setConfirmNumbers(Array(numberOfPicks).fill(''));
    setDrawName('');
    toast({ title: "Campos Limpos", description: "Os números e o nome do sorteio foram removidos.", duration: 3000 });
  };
  
  const handleOpenDialogChange = (open: boolean) => {
    // Reset confirmation numbers when dialog is closed
    if (!open) {
      setConfirmNumbers(Array(numberOfPicks).fill(''));
    }
    setIsConfirmDialogOpen(open);
  };


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
            Escolha a quantidade de números, insira os valores (podem ser repetidos) entre {MIN_NUMBER} e {MAX_NUMBER} e adicione um nome opcional.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
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
          <>
            <div>
              <Label className="text-muted-foreground mb-2 block">Quantidade de Números</Label>
              <RadioGroup defaultValue="10" onValueChange={handleNumberOfPicksChange} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5" id="r1" />
                  <Label htmlFor="r1">5 Números</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10" id="r2" />
                  <Label htmlFor="r2">10 Números</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="drawName" className="text-muted-foreground mb-1 flex items-center">
                <Edit3 className="mr-2 h-4 w-4" /> Nome do Sorteio (Opcional)
              </Label>
              <Input
                id="drawName"
                value={drawName}
                onChange={(e) => setDrawName(e.target.value)}
                placeholder="Ex: Sorteio Especial de Natal"
              />
            </div>

            <div>
              <Label className="text-muted-foreground mb-1">Números Sorteados ({numberOfPicks}):</Label>
              <div className={`grid grid-cols-5 gap-3`}>
                {Array.from({ length: numberOfPicks }).map((_, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={numbers[index]}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    placeholder={`${index + 1}º`}
                    min={MIN_NUMBER}
                    max={MAX_NUMBER}
                    className="text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={`Número ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 pt-6">
          <Button variant="outline" onClick={handleClear} disabled={hasWinningTickets} className="w-full sm:w-auto shadow-md hover:shadow-lg">
            <RotateCcw className="mr-2 h-4 w-4" /> Limpar Campos
          </Button>

          <AlertDialog open={isConfirmDialogOpen} onOpenChange={handleOpenDialogChange}>
            <AlertDialogTrigger asChild>
                <Button 
                    disabled={hasWinningTickets || !areNumbersFilled}
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl text-base py-3 px-6"
                >
                    <PlusCircle className="mr-2 h-5 w-5" /> Cadastrar Sorteio
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><ShieldCheck />Contra-prova de Segurança</AlertDialogTitle>
                    <AlertDialogDescription>
                        Para evitar erros, por favor, digite os números sorteados novamente. O sorteio só será cadastrado se os números forem idênticos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="py-4">
                    <Label className="text-muted-foreground mb-2 block">Confirme os {numberOfPicks} números:</Label>
                    <div className={`grid grid-cols-5 gap-3`}>
                        {Array.from({ length: numberOfPicks }).map((_, index) => (
                        <Input
                            key={`confirm-${index}`}
                            type="number"
                            value={confirmNumbers[index]}
                            onChange={(e) => handleConfirmInputChange(index, e.target.value)}
                            placeholder={`${index + 1}º`}
                            min={MIN_NUMBER}
                            max={MAX_NUMBER}
                            className="text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            aria-label={`Confirmação do Número ${index + 1}`}
                        />
                        ))}
                    </div>
                    {areConfirmNumbersMatching && areNumbersFilled && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={14} /> Os números de confirmação batem!</p>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={validateAndSubmit} 
                        disabled={!areConfirmNumbersMatching}
                    >
                        Confirmar e Cadastrar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};
