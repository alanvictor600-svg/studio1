import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { PWALoader } from '@/components/pwa-loader';

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
         <meta name="theme-color" content="#228B22" />
         <link rel="manifest" href="/manifest.json" />
         <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
       </head>
      <body className={`${GeistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>
            <PWALoader />
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
