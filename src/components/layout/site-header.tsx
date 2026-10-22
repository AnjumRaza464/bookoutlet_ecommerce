import Link from "next/link";
import { ChevronDown, Heart, Phone, Truck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getFacets } from "@/lib/catalog";
import { SITE } from "@/lib/constants";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPKR } from "@/lib/money";
import { AccountMenu, CartLink, MobileNav, SearchForm } from "./header-client";
import { buildNav } from "./nav-items";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./social-icons";

export async function SiteHeader() {
  const [user, facets] = await Promise.all([getCurrentUser(), getFacets()]);
  const nav = buildNav(facets.boards);
  const menuUser = user ? { name: user.name, email: user.email, isStaff: isStaff(user) } : null;

  return (
    <header className="sticky top-0 z-40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* Top bar */}
      <div className="bg-brand-black text-brand-cream">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-brand-gold">
              <FacebookIcon className="size-4" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-brand-gold">
              <YoutubeIcon className="size-4" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-brand-gold">
              <InstagramIcon className="size-4" />
            </a>
          </div>
          <p className="hidden items-center gap-1.5 sm:flex">
            <Truck className="size-3.5 text-brand-gold" /> Free delivery across Pakistan on orders over {formatPKR(FREE_SHIPPING_THRESHOLD)}
          </p>
          <div className="flex items-center gap-3">
            {SITE.phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/-/g, "")}`} className="hidden items-center gap-1 hover:text-brand-gold md:flex">
                <Phone className="size-3.5" /> {p}
              </a>
            ))}
            <Link href="/track" className="font-semibold text-brand-gold hover:underline md:hidden">
              Track order
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-page flex h-[72px] items-center gap-3 lg:gap-6">
        <MobileNav items={nav} user={menuUser} />
        <Link href="/" aria-label="BNB Book Outlet home" className="shrink-0">
          <Logo />
        </Link>
        <SearchForm className="mx-auto hidden max-w-xl flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden size-10 items-center justify-center rounded-full hover:bg-brand-cream sm:inline-flex">
            <Heart className="size-5" />
          </Link>
          <AccountMenu user={menuUser} />
          <CartLink />
          <Link
            href="/books"
            className="ml-2 hidden h-10 items-center rounded-full bg-brand-caramel px-5 text-sm font-bold tracking-wide text-white uppercase shadow hover:bg-brand-brown xl:inline-flex"
          >
            Order now
          </Link>
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchForm />
      </div>

      {/* Category navigation */}
      <nav aria-label="Main" className="hidden bg-brand-brown text-brand-cream lg:block">
        <ul className="container-page flex h-11 items-center justify-center gap-1 text-[13px] font-semibold tracking-wide uppercase">
          {nav.map((item) => (
            <li key={item.href} className="group relative">
              <Link href={item.href} className="flex h-11 items-center gap-1 px-3 hover:bg-brand-black/40 hover:text-brand-gold">
                {item.label}
                {item.children && <ChevronDown className="size-3.5" />}
              </Link>
              {item.children && (
                <div className="invisible absolute top-full left-0 z-50 min-w-56 translate-y-1 rounded-b-md bg-white py-2 text-foreground normal-case opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} className="block px-4 py-2 text-sm font-medium tracking-normal hover:bg-brand-cream hover:text-brand-brown">
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
