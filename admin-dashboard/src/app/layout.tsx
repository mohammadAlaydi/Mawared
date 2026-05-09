import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';

const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700', '800', '900'], variable: '--font-cairo', display: 'swap' });

export const metadata: Metadata = {
  title: 'لوحة التحكم — موارد الدولية',
  description: 'لوحة تحكم إدارة عمليات شركة موارد الدولية للاستقدام',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} antialiased`}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-left" richColors dir="rtl" />
        </AuthProvider>
      </body>
    </html>
  );
}
