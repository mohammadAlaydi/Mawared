import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Official brand fonts (Mawared brand kit): Alexandria (Arabic + primary),
// Manrope (Latin body), Glancyr (Latin display). Self-hosted variable fonts.
const alexandria = localFont({
  src: "../public/fonts/Alexandria-VariableFont_wght.ttf",
  weight: "100 900",
  variable: "--font-alexandria",
  display: "swap",
});

const manrope = localFont({
  src: "../public/fonts/Manrope-VariableFont_wght.ttf",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});

const glancyr = localFont({
  src: "../public/fonts/Glancyr-Variable-VF.ttf",
  variable: "--font-glancyr",
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
    <html
      lang="ar"
      dir="rtl"
      className={`${alexandria.variable} ${manrope.variable} ${glancyr.variable}`}
    >
      <body className={`${alexandria.className} antialiased`}>{children}</body>
    </html>
  );
}
