import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireStaffPage } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | BNB Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage("/admin");
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-brand-black p-4 lg:flex">
        <Link href="/admin" className="mb-8 px-2">
          <Logo inverted />
        </Link>
        <AdminNav />
        <div className="mt-auto rounded-lg bg-white/5 p-3 text-xs text-brand-cream/70">
          Signed in as <span className="block truncate font-semibold text-brand-cream">{user.email}</span>
          <span className="text-brand-gold">{user.role}</span>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-md border border-input px-3 py-1.5 text-sm font-semibold">Menu</summary>
            <div className="absolute top-10 left-0 z-50 w-64 rounded-xl bg-brand-black p-4 shadow-2xl">
              <AdminNav />
            </div>
          </details>
          <p className="hidden text-sm font-semibold lg:block">BNB Book Outlet · Admin</p>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-brown hover:underline">
            View store <ExternalLink className="size-3.5" />
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
