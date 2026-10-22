"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Boxes, ClipboardList, Gauge, GraduationCap, Landmark, Library, Tags, TicketPercent, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "Overview",
    links: [
      { href: "/admin", label: "Dashboard", Icon: Gauge },
      { href: "/admin/reports", label: "Sales reports", Icon: BarChart3 },
    ],
  },
  {
    label: "Catalogue",
    links: [
      { href: "/admin/books", label: "Books", Icon: BookOpen },
      { href: "/admin/inventory", label: "Inventory", Icon: Boxes },
      { href: "/admin/taxonomy/categories", label: "Categories", Icon: Tags },
      { href: "/admin/taxonomy/subjects", label: "Subjects", Icon: GraduationCap },
      { href: "/admin/taxonomy/boards", label: "Boards", Icon: Landmark },
      { href: "/admin/taxonomy/publishers", label: "Publishers", Icon: Library },
    ],
  },
  {
    label: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders", Icon: ClipboardList },
      { href: "/admin/coupons", label: "Discounts & coupons", Icon: TicketPercent },
      { href: "/admin/customers", label: "Customers", Icon: Users },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.2em] text-brand-gold/70 uppercase">{g.label}</p>
          <ul className="space-y-0.5">
            {g.links.map(({ href, label, Icon }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-brand-caramel text-brand-black" : "text-brand-cream/80 hover:bg-white/10 hover:text-brand-cream",
                    )}
                  >
                    <Icon className="size-4" /> {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
