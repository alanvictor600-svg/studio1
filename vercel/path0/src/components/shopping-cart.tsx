
"use client";

import type { FC } from 'react';
import type { User, LotteryConfig } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ShoppingCart as ShoppingCartIcon, Trash2, Coins, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShoppingCartProps {
  cart: number[][];
  currentUser: User | null;
  lotteryConfig: LotteryConfig;
  onPurchase: () => void;
  onRemoveFromCart: (index: number) => void;
  isSubmitting: boolean;
}

export const ShoppingCart: FC<ShoppingCartProps> = ({ 
    cart, 
    currentUser, 
    lotteryConfig, 
    onPurchase,
    onRemoveFromCart,
    isSubmitting
}) => {
  
  const totalCost = cart.length * lotteryConfig.ticketPrice;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative shadow-none h-10 px-2">
          <ShoppingCartIcon className="h-6 w-6" />
          <span className="ml-1">Meu Carrinho</span>
          {cart.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {cart.length}
            </Badge>
          )}
          <span className="sr-only">Abrir carrinho de compras</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none text-primary">Carrinho de Apostas</h4>
            <p className="text-sm text-muted-foreground">
              Revise seus bilhetes e finalize a compra.
            </p>
          </div>

            <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                <span className="font-medium text-muted-foreground flex items-center gap-2">
                    <Coins className="h-4 w-4" /> Seu Saldo:
                </span>
                <span className="font-bold text-lg text-yellow-500">
                    R$ {(currentUser?.saldo || 0).toFixed(2).replace('.', ',')}
                </span>
            </div>

          <Separator />
          
          {cart.length > 0 ? (
            <>
              <ScrollArea className="h-48">
                  <div className="space-y-3 pr-4">
                      {cart.map((ticketNumbers, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-md bg-background">
                              <p className="text-sm font-semibold">Bilhete {index + 1}:</p>
                              <div className="flex flex-wrap gap-1">
                                  {ticketNumbers.map((num, i) => (
                                      <Badge key={i} variant="outline" className="font-mono text-xs">{num}</Badge>
                                  ))}
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemoveFromCart(index)}>
                                  <Trash2 size={14} />
                              </Button>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
              <Separator />
                <div className="space-y-2">
                     <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">R$ {totalCost.toFixed(2).replace('.', ',')}</span>
                     </div>
                     <Button 
                        className="w-full" 
                        onClick={onPurchase}
                        disabled={isSubmitting}
                    >
                         {isSubmitting ? 'Comprando...' : 'Comprar Agora'}
                         {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                     </Button>
                </div>
            </>
          ) : (
             <div className="text-center text-sm text-muted-foreground py-8">
                <p>Seu carrinho está vazio.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
