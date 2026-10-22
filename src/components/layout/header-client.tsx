"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, Heart } from "lucide-react";
import { useCartCount } from "@/lib/cart-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/brand/logo";
import { api } from "@/lib/fetcher";
import type { NavItem } from "./nav-items";

export function CartLink() {
  const count = useCartCount();
  return (
    <Link href="/cart" className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-brand-cream" aria-label={`Cart, ${count} items`}>
      <ShoppingBag className="size-5" />
      <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-brand-caramel px-1 text-[11px] leading-5 font-bold text-white tabular-nums">
        {count}
      </span>
    </Link>
  );
}

export function SearchForm({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form action="/books" role="search" className={`relative ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        Search books
      </label>
      <input
        id="site-search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search by title, subject, publisher or ISBN…"
        className="h-11 w-full rounded-full border border-input bg-white pr-12 pl-5 text-sm outline-none placeholder:text-muted-foreground focus:border-brand-caramel focus:ring-2 focus:ring-brand-caramel/30"
      />
      <button type="submit" aria-label="Search" className="absolute top-1 right-1 grid size-9 place-items-center rounded-full bg-brand-brown text-brand-cream hover:bg-brand-black">
        <Search className="size-4" />
      </button>
    </form>
  );
}

type MenuUser = { name: string; email: string; isStaff: boolean } | null;

export function AccountMenu({ user }: { user: MenuUser }) {
  const router = useRouter();
  if (!user) {
    return (
      <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium hover:bg-brand-cream">
        <User className="size-5" />
        <span className="hidden lg:inline">Sign in</span>
      </Link>
    );
  }
  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium outline-none hover:bg-brand-cream" aria-label="Account menu">
        <User className="size-5" />
        <span className="hidden max-w-28 truncate lg:inline">{user.name.split(" ")[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate font-semibold text-foreground">{user.name}</span>
            <span className="block truncate text-xs font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <User /> My account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account/orders")}>
          <Package /> My orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account/wishlist")}>
          <Heart /> Wishlist
        </DropdownMenuItem>
        {user.isStaff && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <LayoutDashboard /> Admin dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileNav({ items, user }: { items: NavItem[]; user: MenuUser }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex size-10 items-center justify-center rounded-full hover:bg-brand-cream lg:hidden" aria-label="Open menu">
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-brand-black text-brand-cream">
        <SheetHeader>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo inverted />
        </SheetHeader>
        <div className="px-4">
          <SearchForm />
        </div>
        <nav className="flex flex-col px-2 pb-6" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
          {items.map((item) => (
            <div key={item.href} className="border-b border-white/10 py-1">
              <Link href={item.href} className="block rounded px-3 py-2.5 text-sm font-semibold tracking-wide uppercase hover:bg-white/10">
                {item.label}
              </Link>
              {item.children && (
                <div className="grid grid-cols-2 gap-x-2 pb-2 pl-3">
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} className="rounded px-3 py-1.5 text-sm text-brand-cream/80 hover:bg-white/10">
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link href={user ? "/account" : "/login"} className="mt-4 rounded px-3 py-2.5 text-sm font-semibold uppercase hover:bg-white/10">
            {user ? "My account" : "Sign in / Register"}
          </Link>
          {user?.isStaff && (
            <Link href="/admin" className="rounded px-3 py-2.5 text-sm font-semibold uppercase hover:bg-white/10">
              Admin dashboard
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
