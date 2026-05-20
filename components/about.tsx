import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="relative border-b-2 border-ink overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          {/* Headline col */}
          <div className="col-span-12 lg:col-span-5">
            <div className="eyebrow text-crimson">04 — О нас</div>
            <h2 className="display text-[clamp(40px,5.2vw,76px)] mt-3 leading-[0.95]">
              Локальная.<br />
              Краснодарская.<br />
              <span className="quote font-normal italic text-ink/80">Своя.</span>
            </h2>

            <div className="mt-6 quote text-lg leading-relaxed text-ink/85 max-w-md space-y-4">
              <p>
                Мы открылись в 2025 году в ЖК «Светлоград» — без громких слоганов
                и инвесторов. Один зал, две печи, четыре человека на смене.
              </p>
              <p>
                Мы научились делать тесто, которое хочется доесть до корочки,
                и пиццу, которую можно заказать в понедельник вечером, не чувствуя
                себя виноватым.
              </p>
              <p>
                Ежедневно с 11:00 до 22:00. <br />
                <span className="font-medium not-italic">
                  Свежие продукты, честные граммовки, никаких полуфабрикатов.
                </span>
              </p>
            </div>
          </div>

          {/* Photos col — collage */}
          <div className="col-span-12 lg:col-span-7 relative min-h-[480px]">
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-3">
              {/* big — about-1 */}
              <div className="col-span-4 row-span-4 relative border-2 border-ink overflow-hidden shadow-[6px_6px_0_var(--ink)]">
                <Image
                  src="/gallery/about-1.jpg"
                  alt="Pizzagram — пиццерия в Краснодаре"
                  fill
                  sizes="(min-width: 1024px) 35vw, 90vw"
                  className="object-cover"
                />
              </div>
              {/* tall top — about-2 */}
              <div className="col-span-2 row-span-3 col-start-5 row-start-1 relative border-2 border-ink overflow-hidden shadow-[6px_6px_0_var(--crimson)]">
                <Image
                  src="/gallery/about-2.jpg"
                  alt="Pizzagram — пиццерия в Краснодаре"
                  fill
                  sizes="(min-width: 1024px) 20vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* tall bottom — about-3 */}
              <div className="col-span-2 row-span-3 col-start-5 row-start-4 relative border-2 border-ink overflow-hidden shadow-[6px_6px_0_var(--ink)]">
                <Image
                  src="/gallery/about-3.jpg"
                  alt="Pizzagram — пиццерия в Краснодаре"
                  fill
                  sizes="(min-width: 1024px) 20vw, 50vw"
                  className="object-cover"
                />
              </div>
              {/* wide bottom — about-4 */}
              <div className="col-span-4 row-span-2 col-start-1 row-start-5 relative border-2 border-ink overflow-hidden shadow-[6px_6px_0_var(--crimson)]">
                <Image
                  src="/gallery/about-4.jpg"
                  alt="Pizzagram — зал пиццерии"
                  fill
                  sizes="(min-width: 1024px) 35vw, 90vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
