
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/providers';
import { PWALoader } from '@/components/pwa-loader';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const APP_NAME = "Bolão Potiguar";
const APP_DEFAULT_TITLE = "Bolão Potiguar";
const APP_TITLE_TEMPLATE = "%s - Bolão Potiguar";
const APP_DESCRIPTION = "Sua sorte começa aqui!";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
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
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
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
         <link rel="manifest" href="/manifest.webmanifest" />
       </head>
      <body className={`${GeistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <FirebaseClientProvider>
          <Providers>
            <PWALoader />
            {children}
            <Toaster />
          </Providers>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
