import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { SessionProvider } from '@/lib/hooks/use-session';
import { ThemeProvider } from '@/lib/hooks/use-theme';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Crazy Tadka | Office',
  description: 'Internal operations portal for Crazy Tadka restaurant',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Anti-FOUC: run synchronously before paint to set correct theme class */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme-preference');document.documentElement.classList.add(t==='light'?'light':'dark');})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <ThemeProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
        <Toaster
          position="top-right"
          theme="system"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
