import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, CreditCard, GraduationCap, MapPin, Truck } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";
import { BookStackArt } from "@/components/home/book-stack-art";
import { SectionHeading } from "@/components/common/section-heading";
import { BookGrid } from "@/components/books/book-card";
import { getFacets, getFeaturedBooks, getNewArrivals } from "@/lib/catalog";
import { getWishlistIds } from "@/lib/wishlist";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

const CLASS_CARDS = [
  { cls: 9, title: "Class 9", sub: "Matric Part I", tone: "from-brand-brown to-brand-black" },
  { cls: 10, title: "Class 10", sub: "Matric Part II", tone: "from-brand-brown-light to-brand-brown" },
  { cls: 11, title: "1st Year", sub: "Intermediate Part I", tone: "from-[#2a1d15] to-brand-brown-light" },
  { cls: 12, title: "2nd Year", sub: "Intermediate Part II", tone: "from-brand-black to-brand-brown" },
];

const CATEGORY_ICONS: Record<string, string> = {
  textbooks: "📘",
  "guides-and-keybooks": "🗝️",
  notes: "📝",
  "past-papers": "📄",
  "model-papers": "🎯",
};

export default async function HomePage() {
  const [featured, arrivals, facets, wishlistIds, counts] = await Promise.all([
    getFeaturedBooks(8),
    getNewArrivals(8),
    getFacets(),
    getWishlistIds(),
    Promise.all([
      db.book.count({ where: { isActive: true } }),
      db.board.count(),
      db.subject.count(),
    ]),
  ]);
  const [titleCount, boardCount, subjectCount] = counts;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BookStore",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/logo.svg`,
    address: { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "PK" },
    telephone: SITE.phones[0],
    currenciesAccepted: "PKR",
    potentialAction: { "@type": "SearchAction", target: `${SITE.url}/books?q={search_term_string}`, "query-input": "required name=search_term_string" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <h1 className="sr-only">BNB Book Outlet — Matric and Intermediate books online in Pakistan</h1>
      <HeroSlider />

      {/* Intro */}
      <section className="container-page grid items-center gap-10 py-20 md:grid-cols-2">
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-6 -rotate-3 rounded-3xl bg-brand-cream" />
          <div className="relative rounded-3xl bg-gradient-to-br from-brand-brown to-brand-black p-8">
            <BookStackArt className="w-full" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.3em] text-brand-caramel uppercase">Welcome to BNB Book Outlet</p>
          <h2 className="text-4xl font-bold text-brand-black">We make exam preparation simple</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            From the first day of Class 9 to the final paper of 2nd Year, BNB Book Outlet brings you the exact books your board prescribes —
            official textbooks, trusted guides, chapter-wise notes and solved past papers. Every order is packed with care and delivered
            anywhere in Pakistan.
          </p>
          <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            {["Board-approved latest editions", "Prices in PKR, no hidden charges", "Easypaisa & Cash on Delivery", "Delivery to every province"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-brand-caramel" /> {t}
              </li>
            ))}
          </ul>
          <Link href="/about" className="mt-8 inline-flex items-center gap-2 font-semibold text-brand-brown hover:text-brand-caramel">
            Read more <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Shop by class */}
      <section id="shop-by-class" className="bg-brand-cream py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Shop by class" title="Find books for your class" text="Pick your class to see every textbook, guide and past paper you need this session." />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {CLASS_CARDS.map((c) => (
              <Link
                key={c.cls}
                href={`/books?class=${c.cls}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.tone} p-6 text-brand-cream shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <GraduationCap className="size-10 text-brand-gold" />
                <p className="mt-8 font-heading text-3xl font-bold">{c.title}</p>
                <p className="text-sm text-brand-cream/75">{c.sub}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-gold">
                  Explore now <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
                <span className="absolute -right-4 -bottom-6 font-heading text-[7rem] leading-none font-black text-white/5">{c.cls}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-20">
        <SectionHeading eyebrow="Our range" title="Everything you need to excel" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {facets.categories.map((c) => (
            <Link key={c.id} href={`/books?category=${c.slug}`} className="group rounded-2xl border border-border bg-card p-6 text-center transition hover:border-brand-caramel hover:shadow-lg">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-cream text-3xl transition group-hover:scale-110" aria-hidden="true">
                {CATEGORY_ICONS[c.slug] ?? "📚"}
              </span>
              <h3 className="mt-4 text-lg font-bold text-brand-black">{c.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              <span className="mt-3 inline-block text-xs font-bold tracking-wide text-brand-caramel uppercase">Explore now</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-page pb-20">
          <SectionHeading eyebrow="Bestsellers" title="Featured books" />
          <BookGrid books={featured} wishlistIds={wishlistIds} />
          <div className="mt-10 text-center">
            <Link href="/books" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-brown px-8 text-sm font-bold text-brand-cream uppercase hover:bg-brand-black">
              View all books <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Stats strip */}
      <section className="bg-brand-black py-14 text-brand-cream">
        <div className="container-page grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {[
            { value: titleCount, label: "Titles in stock", Icon: BookOpen },
            { value: boardCount, label: "Boards covered", Icon: MapPin },
            { value: subjectCount, label: "Subjects", Icon: GraduationCap },
            { value: "24/7", label: "Online ordering", Icon: CreditCard },
          ].map(({ value, label, Icon }) => (
            <div key={label}>
              <Icon className="mx-auto size-8 text-brand-gold" />
              <p className="mt-3 font-heading text-4xl font-bold">{value}</p>
              <p className="text-sm tracking-wide text-brand-cream/70 uppercase">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Big discount banner */}
      <section className="container-page py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-caramel via-[#b9813c] to-brand-brown p-10 text-white sm:p-14">
          <div className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-black/10" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold tracking-[0.3em] uppercase">Big discount</p>
              <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">Save 10% on your first order</h2>
              <p className="mt-3 max-w-xl text-white/85">
                Apply code <strong className="rounded bg-white/20 px-2 py-0.5 tracking-widest">WELCOME10</strong> at checkout on orders above Rs. 1,000.
              </p>
            </div>
            <Link href="/books" className="inline-flex h-12 items-center justify-center rounded-full bg-brand-black px-8 text-sm font-bold uppercase hover:bg-white hover:text-brand-black">
              Shop the sale
            </Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-page pb-20">
        <SectionHeading eyebrow="Just in" title="New arrivals" />
        <BookGrid books={arrivals} wishlistIds={wishlistIds} />
      </section>

      {/* Why us */}
      <section className="bg-brand-cream py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Why BNB" title="Why students and parents choose us" />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: BadgeCheck, title: "Genuine, latest editions", text: "We stock the editions your board prescribes for the current session — no outdated prints." },
              { Icon: Truck, title: "Delivery across Pakistan", text: "From Karachi to Gilgit, we deliver to every province with tracking on every order." },
              { Icon: CreditCard, title: "Pay the way you like", text: "Pay securely with Easypaisa, by manual Easypaisa transfer, or Cash on Delivery." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-white p-8 shadow-sm">
                <span className="grid size-12 place-items-center rounded-full bg-brand-brown text-brand-gold">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-brand-black">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Boards */}
      <section className="container-page py-20">
        <SectionHeading eyebrow="Our boards" title="Books for every board" text="Browse the complete syllabus for your examination board." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facets.boards.map((b) => (
            <Link key={b.id} href={`/books?board=${b.slug}`} className="flex items-start gap-3 rounded-xl border border-border p-4 transition hover:border-brand-caramel hover:bg-brand-cream">
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand-caramel" />
              <span>
                <span className="block font-semibold text-brand-black">{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.province}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
