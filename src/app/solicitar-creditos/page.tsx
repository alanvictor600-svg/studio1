
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Smartphone, Copy, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { CreditRequestConfig } from '@/types';

const CREDIT_REQUEST_CONFIG_STORAGE_KEY = 'bolaoPotiguarCreditRequestConfig';

export default function SolicitarCreditosPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [config, setConfig] = useState<CreditRequestConfig | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedConfig = localStorage.getItem(CREDIT_REQUEST_CONFIG_STORAGE_KEY);
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    }
  }, []);

  const handleCopy = (text: string, label: string) => {
    if (!text) {
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
        <header className="mb-8 w-full">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Solicitar Créditos
            </h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Entre em contato conosco para adicionar saldo à sua conta.
          </p>
        </header>

        <main className="space-y-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-6 w-6 text-green-500" />
                Opção 1: WhatsApp
              </CardTitle>
              <CardDescription>
                A forma mais rápida de nos contatar. Envie uma mensagem e retornaremos em breve.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-4">
              <p className="font-mono text-lg p-3 rounded-md bg-muted flex-grow text-center sm:text-left">
                {config?.whatsappNumber || 'Não configurado'}
              </p>
              <Button 
                onClick={() => handleCopy(config?.whatsappNumber || '', 'Número de WhatsApp')}
                disabled={!config?.whatsappNumber}
                className="w-full sm:w-auto"
              >
                <Copy className="mr-2 h-4 w-4" /> Copiar Número
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="h-6 w-6 text-blue-500" />
                Opção 2: Pagamento via Pix
              </CardTitle>
              <CardDescription>
                Faça um Pix e envie o comprovante para o nosso WhatsApp para agilizar a liberação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-md bg-muted">
                 <p className="font-mono text-sm sm:text-base flex-grow text-center sm:text-left break-all">
                    {config?.pixKey || 'Não configurado'}
                </p>
                <Button 
                    onClick={() => handleCopy(config?.pixKey || '', 'Chave Pix')}
                    disabled={!config?.pixKey}
                    className="w-full sm:w-auto flex-shrink-0"
                >
                    <Copy className="mr-2 h-4 w-4" /> Copiar Chave
                </Button>
              </div>
              <div className="text-center p-4 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Ou escaneie o QR Code</p>
                <div className="flex justify-center">
                    {config?.pixQrCodeUrl ? (
                        <Image
                            src={config.pixQrCodeUrl}
                            alt="QR Code para pagamento Pix"
                            width={200}
                            height={200}
                            className="rounded-md shadow-md"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    ) : (
                        <div className="h-[200px] w-[200px] flex flex-col items-center justify-center bg-muted rounded-md">
                            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2"/>
                            <span className="text-sm text-muted-foreground">QR Code não disponível.</span>
                        </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-8 p-4 bg-primary/10 text-primary rounded-lg">
            <p className="font-semibold">Importante!</p>
            <p className="text-sm">Após realizar o pagamento por qualquer um dos métodos, por favor, envie o comprovante para o nosso WhatsApp para que os créditos sejam liberados o mais rápido possível.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
