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

export default function Page() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <MenuSection />
      <Reveal><Delivery /></Reveal>
      <Reveal><About /></Reveal>
      <Reveal><Reviews /></Reveal>
      <Reveal><Footer /></Reveal>
      <CartDrawer />
      <StickyCta />
    </main>
  );
}
