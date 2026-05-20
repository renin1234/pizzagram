import type { Metadata, Viewport } from "next";
import { Oswald, Unbounded, Inter_Tight, Lora } from "next/font/google";
import CookieBanner from "@/components/cookie-banner";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});
const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-unbounded",
  display: "swap",
});
const interTight = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter-tight",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PIZZAGRAM — Честная пицца. Краснодар.",
  description:
    "Пиццерия Pizzagram в Краснодаре. 32 см от 350 ₽. Доставка за 60 минут, самовывоз, ежедневно с 11:00 до 22:00.",
  openGraph: {
    title: "PIZZAGRAM — Честная пицца. Краснодар.",
    description: "32 см от 350 ₽. Доставка за 60 минут.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF4D39",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${oswald.variable} ${unbounded.variable} ${interTight.variable} ${lora.variable}`}
    >
      <body className="font-body antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
