import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with BNB Book Outlet for orders, bulk school purchases and support.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const cards = [
    { Icon: Phone, title: "Call us", lines: SITE.phones.map((p) => ({ text: p, href: `tel:${p.replace(/-/g, "")}` })) },
    { Icon: Mail, title: "Email", lines: [SITE.email, SITE.supportEmail].map((e) => ({ text: e, href: `mailto:${e}` })) },
    { Icon: MapPin, title: "Visit", lines: [{ text: SITE.address }] },
    { Icon: Clock, title: "Hours", lines: [{ text: "Mon–Sat, 10:00 am – 8:00 pm" }, { text: "Online orders 24/7" }] },
  ];
  return (
    <div className="container-page py-16">
      <p className="text-xs font-bold tracking-[0.3em] text-brand-caramel uppercase">Contact</p>
      <h1 className="mt-2 text-4xl font-bold text-brand-black">We&apos;re here to help</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Questions about an order, a missing title or bulk orders for your school or academy? Reach us using any of the options below.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ Icon, title, lines }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-6">
            <span className="grid size-12 place-items-center rounded-full bg-brand-brown text-brand-gold">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{title}</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {lines.map((l) => (
                <li key={l.text}>{"href" in l && l.href ? <a href={l.href} className="hover:text-brand-brown">{l.text}</a> : l.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
