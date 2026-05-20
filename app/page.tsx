import Header from "@/components/header";
import Hero from "@/components/hero";
import MenuSection from "@/components/menu-section";
import Delivery from "@/components/delivery";
import About from "@/components/about";
import Reviews from "@/components/reviews";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import StickyCta from "@/components/sticky-cta";

export default function Page() {
  return (
    <main className="relative">
      <Header />
      <Hero />
      <MenuSection />
      <Delivery />
      <About />
      <Reviews />
      <Footer />
      <CartDrawer />
      <StickyCta />
    </main>
  );
}
