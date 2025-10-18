
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Define a interface para o evento 'beforeinstallprompt'
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o mini-infobar de aparecer no Chrome
      e.preventDefault();
      // Guarda o evento para que possa ser disparado mais tarde.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Evento para quando o app é instalado
    const handleAppInstalled = () => {
      // Oculta o prompt de instalação, pois o app já foi instalado
      setDeferredPrompt(null);
      toast({
        title: "App Instalado!",
        description: "O Bolão Potiguar foi adicionado à sua tela inicial.",
        className: "bg-primary text-primary-foreground",
      });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    // Espera o usuário responder ao prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Opcionalmente, pode-se analisar o resultado da escolha do usuário
    console.log(`User response to the install prompt: ${outcome}`);
    // O evento 'beforeinstallprompt' só é disparado uma vez, então limpamos o estado.
    setDeferredPrompt(null);
  };

  // Só mostra o botão se o prompt foi capturado e estiver em um dispositivo móvel
  if (!deferredPrompt || !isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      onClick={handleInstallClick}
      className="text-primary hover:text-primary/90"
      aria-label="Instalar aplicativo"
    >
      <Download className="mr-2 h-4 w-4" />
      Instalar App
    </Button>
  );
}
