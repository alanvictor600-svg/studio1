
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export function NotFoundClient() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <AlertTriangle className="h-16 w-16 text-primary mb-4" />
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
        404 - Página Não Encontrada
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Oops! A página que você está procurando não existe, foi removida ou está temporariamente indisponível.
      </p>
      <Button asChild className="mt-8 text-lg">
        <Link href="/">
          <Home className="mr-2 h-5 w-5" />
          Voltar para a Página Inicial
        </Link>
      </Button>
    </div>
  );
}
