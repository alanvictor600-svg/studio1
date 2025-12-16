import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InstallPwaButton } from '@/components/install-pwa-button';

export const HeroSection = () => (
  <section className="text-center py-16 md:py-24 bg-gradient-to-b from-emerald-700 to-emerald-900">
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-transparent bg-clip-text">
        A Próxima Grande Sorte Pode Ser a Sua.
      </h1>
      <p className="mt-4 text-lg md:text-xl text-white">
        Escolha seus números, sinta a emoção e transforme um simples palpite em prêmios incríveis. A aposta é fácil, a diversão é garantida.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4">
        <Button asChild size="lg" className="text-lg shadow-lg">
          <Link href="/cadastrar">Comece a Apostar Agora</Link>
        </Button>
        <div className="mt-4">
            <InstallPwaButton />
        </div>
      </div>
    </div>
  </section>
);
