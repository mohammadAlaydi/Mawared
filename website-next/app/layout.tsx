import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "موارد الدولية — شركة موارد الدولية للإستقدام",
  description:
    "شركة موارد الدولية للاستقدام — منصة استقدام عمالة منزلية موثوقة في المملكة العربية السعودية. عاملات منزليات، سائقين، مربيات أطفال، ورعاية مسنين.",
  keywords: [
    "استقدام",
    "عمالة منزلية",
    "موارد الدولية",
    "عاملة منزلية",
    "سائق خاص",
    "مربية أطفال",
    "السعودية",
    "الرياض",
  ],
  openGraph: {
    title: "موارد الدولية — شركة موارد الدولية للإستقدام",
    description: "منصة استقدام عمالة منزلية موثوقة في المملكة العربية السعودية",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} antialiased`}>{children}</body>
    </html>
  );
}
