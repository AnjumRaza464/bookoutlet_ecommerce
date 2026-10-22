"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookStackArt } from "./book-stack-art";

const SLIDES = [
  {
    eyebrow: "Session 2026–27",
    title: "Every Matric & Inter book, in one place",
    text: "Textbooks, guides, notes and past papers for Class 9 to 12 — for every major board in Pakistan.",
    cta: { label: "Shop now", href: "/books" },
    secondary: { label: "Browse by class", href: "#shop-by-class" },
    bg: "from-brand-black via-[#24170f] to-brand-brown",
  },
  {
    eyebrow: "Exam season special",
    title: "Solved past papers for every board",
    text: "Ten years of solved annual papers from FBISE, Lahore, Karachi, Multan, Peshawar and more.",
    cta: { label: "Explore past papers", href: "/books?category=past-papers" },
    secondary: { label: "Model papers", href: "/books?category=model-papers" },
    bg: "from-brand-brown via-[#5a361f] to-brand-black",
  },
  {
    eyebrow: "Big discount",
    title: "10% off your first order",
    text: "Use code WELCOME10 at checkout on orders above Rs. 1,000. Free delivery on orders over Rs. 3,000.",
    cta: { label: "Start shopping", href: "/books?sort=newest" },
    secondary: { label: "Guides & keybooks", href: "/books?category=guides-and-keybooks" },
    bg: "from-[#2a1d15] via-brand-brown-light to-brand-brown",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const go = (d: number) => setIndex((i) => (i + d + SLIDES.length) % SLIDES.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[480px] sm:h-[460px] lg:h-[520px]">
        {SLIDES.map((s, i) => (
          <div
            key={s.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 bg-gradient-to-br transition-opacity duration-700",
              s.bg,
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#e0b56a_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="container-page relative grid h-full items-center gap-6 md:grid-cols-2">
              <div className="text-brand-cream">
                <p className="mb-3 inline-block rounded-full border border-brand-gold/40 px-3 py-1 text-xs font-semibold tracking-[0.25em] text-brand-gold uppercase">
                  {s.eyebrow}
                </p>
                <h2 className="text-4xl leading-tight font-extrabold sm:text-5xl lg:text-6xl">{s.title}</h2>
                <p className="mt-4 max-w-lg text-base text-brand-cream/80 sm:text-lg">{s.text}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href={s.cta.href}
                    tabIndex={i === index ? 0 : -1}
                    className="inline-flex h-12 items-center rounded-full bg-brand-caramel px-7 text-sm font-bold tracking-wide text-white uppercase shadow-lg hover:bg-brand-gold hover:text-brand-black"
                  >
                    {s.cta.label}
                  </Link>
                  <Link
                    href={s.secondary.href}
                    tabIndex={i === index ? 0 : -1}
                    className="inline-flex h-12 items-center rounded-full border border-brand-cream/40 px-7 text-sm font-bold tracking-wide text-brand-cream uppercase hover:bg-white/10"
                  >
                    {s.secondary.label}
                  </Link>
                </div>
              </div>
              <BookStackArt className="mx-auto hidden w-full max-w-md drop-shadow-2xl md:block" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => go(-1)} aria-label="Previous slide" className="absolute top-1/2 left-3 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:grid">
        <ChevronLeft className="size-5" />
      </button>
      <button onClick={() => go(1)} aria-label="Next slide" className="absolute top-1/2 right-3 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25 sm:grid">
        <ChevronRight className="size-5" />
      </button>
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={cn("h-2 rounded-full transition-all", i === index ? "w-8 bg-brand-gold" : "w-2 bg-white/40 hover:bg-white/70")}
          />
        ))}
      </div>
    </section>
  );
}
