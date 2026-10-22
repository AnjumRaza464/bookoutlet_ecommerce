import Link from "next/link";
import { Heart, Package, User } from "lucide-react";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const links = [
  { href: "/account", label: "Overview", Icon: User },
  { href: "/account/orders", label: "My orders", Icon: Package },
  { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <p className="text-xs font-bold tracking-[0.3em] text-brand-caramel uppercase">My account</p>
        <h1 className="text-3xl font-bold text-brand-black">Assalam-o-Alaikum, {user.name.split(" ")[0]}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Account" className="flex gap-2 overflow-x-auto lg:flex-col">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-cream">
              <Icon className="size-4 text-brand-caramel" /> {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
