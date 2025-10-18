"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PWALoader() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          // O registro foi bem-sucedido
          // console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.error('SW registration failed: ', registrationError);
          toast({
            title: "Erro de Instalação",
            description: "Não foi possível inicializar o modo de aplicativo. Funcionalidades offline podem não estar disponíveis.",
            variant: "destructive",
          });
        });
      });
    }
  }, [toast]);

  return null; // This component does not render anything.
}
