import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import { ExamSyncProvider } from '@/providers/ExamSyncProvider';
import { GlobalLoadingOverlay } from '@/components/common/GlobalLoadingOverlay';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HexTorq Exams',
  description: 'HexTorq Exams — Online Examination Platform for Super Admins, Admins, and Students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ExamSyncProvider />
            {children}
            <GlobalLoadingOverlay />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
