import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query-client';
import { Toaster } from 'sonner';

// Official brand fonts (Mawared brand kit): Alexandria (Arabic + primary),
// Manrope (Latin body), Glancyr (Latin display). Self-hosted variable fonts.
const alexandria = localFont({
  src: '../../public/fonts/Alexandria-VariableFont_wght.ttf',
  weight: '100 900',
  variable: '--font-alexandria',
  display: 'swap',
});

const manrope = localFont({
  src: '../../public/fonts/Manrope-VariableFont_wght.ttf',
  weight: '200 800',
  variable: '--font-manrope',
  display: 'swap',
});

const glancyr = localFont({
  src: '../../public/fonts/Glancyr-Variable-VF.ttf',
  variable: '--font-glancyr',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لوحة التحكم — موارد الدولية',
  description: 'لوحة تحكم إدارة عمليات شركة موارد الدولية للاستقدام',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${alexandria.variable} ${manrope.variable} ${glancyr.variable}`}
    >
      <body className={`${alexandria.className} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="bottom-left" richColors dir="rtl" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
