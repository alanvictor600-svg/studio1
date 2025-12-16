import Link from 'next/link';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

export const Footer = () => (
  <footer className="bg-secondary border-t">
    <div className="container mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} <Link href="/login?as=admin" className="hover:text-primary">Bolão Potiguar</Link>. Todos os direitos reservados.</p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-primary">Termos de Serviço</Link>
            <Link href="#" className="hover:text-primary">Política de Privacidade</Link>
            <ThemeToggleButton />
        </div>
    </div>
  </footer>
);
