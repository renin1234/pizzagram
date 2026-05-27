import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import CookieBanner from "@/components/cookie-banner";
import PizzaCursor from "@/components/pizza-cursor";
import PizzaAssistant from "@/components/pizza-assistant";
import AuthProvider from "@/components/auth-provider";
import ClosedBanner from "@/components/closed-banner";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-inter-tight",
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
    <html lang="ru" className={interTight.variable}>
      <body className="font-body antialiased">
        <AuthProvider>
          <ClosedBanner />
          {children}
        </AuthProvider>
        <CookieBanner />
        <PizzaCursor />
        <PizzaAssistant />
      </body>
    </html>
  );
}
