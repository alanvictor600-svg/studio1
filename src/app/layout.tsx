import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/providers';

const APP_NAME = "Bolão Potiguar";
const APP_DEFAULT_TITLE = "Bolão Potiguar";
const APP_TITLE_TEMPLATE = "%s - Bolão Potiguar";
const APP_DESCRIPTION = "Sua sorte começa aqui!";
const APP_URL = "https://studio-two-beige.vercel.app";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: "Bolão Potiguar - Sua Sorte Começa Aqui!",
    description: "Sua sorte começa aqui! Escolha seus números e transforme um simples palpite em prêmios incríveis.",
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}/logo-512.png`, // URL absoluta para a imagem
        width: 512,
        height: 512,
        alt: "Logo Bolão Potiguar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolão Potiguar - Sua Sorte Começa Aqui!",
    description: "Sua sorte começa aqui! Escolha seus números e transforme um simples palpite em prêmios incríveis.",
    images: [`${APP_URL}/logo-512.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
       <head>
         <meta name="theme-color" content="#15803d" />
         <link rel="apple-touch-icon" href="/logo.png" />
         <link rel="shortcut icon" href="/logo.png" />
       </head>
      <body className={`${GeistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
