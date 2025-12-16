import { UserPlus, Gamepad2, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const HowItWorksSection = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-primary">Como Funciona?</h2>
        <p className="mt-3 text-lg text-muted-foreground">É fácil participar. Siga os três passos abaixo:</p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
        <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
                <UserPlus size={32} />
                </div>
                <h3 className="text-xl font-bold">1. Cadastre-se</h3>
                <p className="text-muted-foreground mt-2">Crie sua conta de cliente de forma rápida e segura.</p>
            </div>
        </Card>
        <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
                <Gamepad2 size={32} />
                </div>
                <h3 className="text-xl font-bold">2. Faça sua Aposta</h3>
                <p className="text-muted-foreground mt-2">Escolha seus 10 números da sorte, de 1 a 25. Pode repetir!</p>
            </div>
        </Card>
        <Card className="p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
                <Gift size={32} />
                </div>
                <h3 className="text-xl font-bold">3. Concorra aos Prêmios</h3>
                <p className="text-muted-foreground mt-2">Aguarde o sorteio. Se seus 10 números forem sorteados, você ganha!</p>
            </div>
        </Card>
        </div>
    </div>
  </section>
);
