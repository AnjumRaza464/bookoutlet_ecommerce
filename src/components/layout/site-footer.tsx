import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SITE } from "@/lib/constants";
import { NewsletterForm } from "./newsletter-form";
import { FacebookIcon, InstagramIcon, WhatsappIcon, YoutubeIcon } from "./social-icons";

const useful = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Track Your Order", href: "/track" },
  { label: "Shipping & Delivery", href: "/policies#shipping" },
  { label: "Returns & Refunds", href: "/policies#returns" },
  { label: "Payment Methods", href: "/policies#payments" },
];

const range = [
  { label: "Class 9 Books", href: "/books?class=9" },
  { label: "Class 10 Books", href: "/books?class=10" },
  { label: "1st Year Books", href: "/books?class=11" },
  { label: "2nd Year Books", href: "/books?class=12" },
  { label: "Guides & Keybooks", href: "/books?category=guides-and-keybooks" },
  { label: "Past Papers", href: "/books?category=past-papers" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-brand-black text-brand-cream">
      <div className="h-1.5 bg-gradient-to-r from-brand-brown via-brand-caramel to-brand-brown" />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo inverted />
          <p className="text-sm leading-relaxed text-brand-cream/75">
            Pakistan&apos;s dedicated outlet for Matric and Intermediate textbooks, guides, notes and past papers — genuine books, fair prices,
            delivered to your door.
          </p>
          <div className="flex gap-3">
            {[
              { Icon: FacebookIcon, label: "Facebook", href: "https://facebook.com" },
              { Icon: InstagramIcon, label: "Instagram", href: "https://instagram.com" },
              { Icon: YoutubeIcon, label: "YouTube", href: "https://youtube.com" },
              { Icon: WhatsappIcon, label: "WhatsApp", href: "https://wa.me/923000000000" },
            ].map(({ Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-9 place-items-center rounded-full border border-white/15 hover:border-brand-gold hover:text-brand-gold">
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-brand-gold">Contact</h2>
          <ul className="space-y-3 text-sm text-brand-cream/80">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-caramel" /> {SITE.address}
            </li>
            {SITE.phones.map((p) => (
              <li key={p} className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-caramel" />
                <a href={`tel:${p.replace(/-/g, "")}`} className="hover:text-brand-gold">
                  {p}
                </a>
              </li>
            ))}
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand-caramel" />
              <a href={`mailto:${SITE.email}`} className="hover:text-brand-gold">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:col-span-2 lg:col-span-1">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand-gold">Useful Links</h2>
            <ul className="space-y-2 text-sm text-brand-cream/80">
              {useful.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand-gold">Our Range</h2>
            <ul className="space-y-2 text-sm text-brand-cream/80">
              {range.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-gold">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-brand-gold">Newsletter</h2>
          <p className="mb-4 text-sm text-brand-cream/75">New editions, exam-season discounts and past paper releases — straight to your inbox.</p>
          <NewsletterForm />
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-semibold tracking-wide uppercase">
            <span className="rounded border border-white/15 px-2 py-1">Easypaisa</span>
            <span className="rounded border border-white/15 px-2 py-1">Cash on Delivery</span>
            <span className="rounded border border-white/15 px-2 py-1">Nationwide delivery</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-cream/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Prices in Pakistani Rupees (PKR). Delivery across all provinces of Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
