import Header from "@/components/header";
import Hero from "@/components/hero";
import MenuSection from "@/components/menu-section";
import Delivery from "@/components/delivery";
import About from "@/components/about";
import Reviews from "@/components/reviews";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import StickyCta from "@/components/sticky-cta";
import Reveal from "@/components/reveal";
import { readMenu } from "@/lib/menu-data";

// ISR: кешируем рендер на 60 секунд. Обновление меню через админку
// отображается на сайте в течение минуты без редеплоя.
export const revalidate = 60;

export default async function Page() {
  const allMenu = await readMenu();
  const menu = allMenu.filter((item) => !item.hidden);

  return (
    <main className="relative">
      <Header />
      <Hero />
      <MenuSection initialMenu={menu} />
      <Reveal><Delivery /></Reveal>
      <Reveal><About /></Reveal>
      <Reveal><Reviews /></Reveal>
      <Reveal><Footer /></Reveal>
      <CartDrawer />
      <StickyCta />
    </main>
  );
}
