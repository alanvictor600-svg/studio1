
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // GeistSans is a named export and is the font object.
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// No need to call GeistSans() as it's already the configured font object.
// The object directly provides `variable` and `className` properties.
// The `variable` property will provide the CSS variable name, e.g., '--font-geist-sans'.

export const metadata: Metadata = {
  title: 'Bolão Potiguar',
  description: 'Sua sorte começa aqui!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      {/* Use GeistSans.variable directly to apply the CSS variable to the body */}
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

