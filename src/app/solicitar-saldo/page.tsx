

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MessageSquare, Smartphone, Copy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CreditRequestConfig } from '@/types';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DEFAULT_CREDIT_CONFIG: CreditRequestConfig = {
    whatsappNumber: 'Não configurado',
    pixKey: 'Não configurado',
};


export default function SolicitarSaldoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<CreditRequestConfig>(DEFAULT_CREDIT_CONFIG);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Listen for global lottery config in real-time
    const configDocRef = doc(db, 'configs', 'global');
    const unsubscribe = onSnapshot(configDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setConfig({
                whatsappNumber: data.whatsappNumber || DEFAULT_CREDIT_CONFIG.whatsappNumber,
                pixKey: data.pixKey || DEFAULT_CREDIT_CONFIG.pixKey,
            });
        } else {
            setConfig(DEFAULT_CREDIT_CONFIG);
        }
    }, (error) => {
        console.error("Error fetching remote config: ", error);
        toast({ title: "Erro de Configuração", description: "Não foi possível carregar as informações de contato.", variant: "destructive" });
        setConfig(DEFAULT_CREDIT_CONFIG);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);

  const handleCopy = (text: string, label: string) => {
    if (!text || text === 'Não configurado') {
      toast({
        title: 'Informação não disponível',
        description: `O administrador ainda não configurou ${label}.`,
        variant: 'destructive',
      });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copiada!`,
      description: `A informação foi copiada para sua área de transferência.`,
      className: "bg-primary text-primary-foreground",
    });
  };
  
  const sanitizedWhatsAppNumber = config?.whatsappNumber.replace(/\D/g, '') || '';
  const whatsappUrl = `https://wa.me/${sanitizedWhatsAppNumber}`;


  if (!isClient) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <p className="text-foreground text-xl">Carregando...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <header className="mb-8 w-full text-center">
          <div className="flex items-center justify-center relative mb-4">
             <Button variant="outline" size="icon" onClick={() => router.back()} className="absolute left-0 top-1/2 -translate-y-1/2">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-transparent bg-clip-text">
              A Sorte te Espera!
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mt-2 max-w-xl mx-auto">
            Recarregue seu saldo para não perder a chance de ganhar. É rápido e fácil!
          </p>
        </header>

        <main className="space-y-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-card/80 backdrop-blur-sm">
                <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-primary">Passo a Passo para Recarregar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">1</div>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">Escolha um Método de Pagamento</h3>
                            <p className="text-muted-foreground">Você pode pagar via Pix ou combinar o pagamento direto conosco pelo WhatsApp.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">2</div>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">Envie o Comprovante</h3>
                            <p className="text-muted-foreground">Após o pagamento, sempre envie o comprovante para nosso WhatsApp para agilizar a liberação do seu saldo.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">3</div>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">Aguarde a Confirmação</h3>
                            <p className="text-muted-foreground">Seu saldo será atualizado em instantes após a confirmação. E pronto, é só voltar a apostar!</p>
                        </div>
                    </div>
                </CardContent>
            </Card>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="text-center pb-4">
                        <Smartphone className="h-10 w-10 text-primary mx-auto mb-2" />
                        <CardTitle>Pagamento via Pix</CardTitle>
                        <CardDescription>Use a chave Pix.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-md bg-muted text-center">
                            <Label className="text-xs text-muted-foreground">Chave Pix</Label>
                            <p className="font-mono text-sm sm:text-base flex-grow text-center break-all">
                                {config?.pixKey}
                            </p>
                        </div>
                        <Button 
                            onClick={() => handleCopy(config?.pixKey, 'Chave Pix')}
                            disabled={!config?.pixKey || config.pixKey === 'Não configurado'}
                            variant="outline"
                            className="w-full"
                        >
                            <Copy className="mr-2 h-4 w-4" /> Copiar Chave
                        </Button>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="text-center pb-4">
                        <MessageSquare className="h-10 w-10 text-green-500 mx-auto mb-2" />
                        <CardTitle>Pagamento via WhatsApp</CardTitle>
                        <CardDescription>Combine o pagamento conosco.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-full gap-4 pt-4">
                        <div className="p-3 rounded-md bg-muted text-center">
                            <Label className="text-xs text-muted-foreground">Nosso Número</Label>
                            <p className="font-mono text-lg text-center">
                                {config?.whatsappNumber}
                            </p>
                        </div>
                        <Button asChild disabled={!config?.whatsappNumber || config.whatsappNumber === 'Não configurado'} className="w-full bg-green-500 hover:bg-green-600 text-white">
                            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                            <Send className="mr-2 h-4 w-4" /> Combinar Pagamento
                            </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center pt-2">Clique no botão para abrir a conversa, tirar dúvidas e combinar o pagamento.</p>
                    </CardContent>
                </Card>
            </div>
          
            <div className="text-center mt-8 p-4 bg-primary/10 text-primary rounded-lg shadow-inner">
                <p className="font-bold text-lg">Não deixe a sorte escapar.</p>
                <p>Recarregue agora e boa sorte! 🍀</p>
            </div>
        </main>
      </div>
    </div>
  );
}

    
