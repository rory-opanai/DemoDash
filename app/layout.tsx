import type { Metadata } from 'next';
import './globals.css';
import '../styles/gradients.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { TokenLatencyHud } from '@/components/ui/TokenLatencyHud';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenAI API Demo Hub',
  description: 'Frontend-only scaffold for OpenAI API demos'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppHeader />
          <main className="container py-8 md:py-10 min-h-[70vh]">{children}</main>
          <AppFooter />
          <TokenLatencyHud />
        </Providers>
      </body>
    </html>
  );
}


