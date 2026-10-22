"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";
import { formatPKR } from "@/lib/money";
import { effectivePrice } from "@/lib/pricing";
import { adminInput } from "./ui";

export type QuickBook = {
  id: string;
  title: string;
  sku: string;
  classLevel: number;
  price: number;
  discountPercent: number;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  category: string;
  board: string;
};

/** Table row with inline editing of price, discount, stock and visibility. */
export function BookQuickRow({ book }: { book: QuickBook }) {
  const router = useRouter();
  const [v, setV] = useState({ price: book.price, discountPercent: book.discountPercent, stock: book.stock, isActive: book.isActive, isFeatured: book.isFeatured });
  const [saving, setSaving] = useState(false);
  const dirty = v.price !== book.price || v.discountPercent !== book.discountPercent || v.stock !== book.stock || v.isActive !== book.isActive || v.isFeatured !== book.isFeatured;

  async function save(patch = v) {
    setSaving(true);
    try {
      await api(`/api/admin/books/${book.id}`, { method: "PATCH", body: patch });
      toast.success(`Saved “${book.title}”`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const num = (k: "price" | "discountPercent" | "stock") => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Math.max(0, Math.floor(Number(e.target.value) || 0)) });
  const stockTone = v.stock === 0 ? "text-red-700" : v.stock <= book.lowStockAlert ? "text-amber-700" : "";

  return (
    <tr className={!v.isActive ? "bg-muted/50 text-muted-foreground" : undefined}>
      <td className="py-2 pr-3">
        <Link href={`/admin/books/${book.id}`} className="line-clamp-2 font-medium text-foreground hover:text-brand-brown">{book.title}</Link>
        <span className="text-xs text-muted-foreground">{book.sku} · Class {book.classLevel} · {book.category} · {book.board}</span>
      </td>
      <td className="py-2 pr-3">
        <input type="number" min={1} aria-label="Price" value={v.price} onChange={num("price")} className={`${adminInput} w-24`} />
      </td>
      <td className="py-2 pr-3">
        <input type="number" min={0} max={90} aria-label="Discount percent" value={v.discountPercent} onChange={num("discountPercent")} className={`${adminInput} w-16`} />
        <span className="block text-[11px] text-muted-foreground">= {formatPKR(effectivePrice(v))}</span>
      </td>
      <td className="py-2 pr-3">
        <input type="number" min={0} aria-label="Stock" value={v.stock} onChange={num("stock")} className={`${adminInput} w-20 ${stockTone}`} />
      </td>
      <td className="py-2 pr-3 text-center">
        <input type="checkbox" aria-label="Visible in store" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} className="size-4 accent-[#4a2c1a]" />
      </td>
      <td className="py-2 pr-3 text-center">
        <input type="checkbox" aria-label="Featured" checked={v.isFeatured} onChange={(e) => setV({ ...v, isFeatured: e.target.checked })} className="size-4 accent-[#4a2c1a]" />
      </td>
      <td className="py-2 text-right whitespace-nowrap">
        <button type="button" disabled={!dirty || saving} onClick={() => save()} className="inline-flex h-8 items-center gap-1 rounded-md bg-brand-brown px-3 text-xs font-semibold text-brand-cream disabled:opacity-40">
          {saving && <Loader2 className="size-3 animate-spin" />} Save
        </button>
        <Link href={`/admin/books/${book.id}`} aria-label={`Edit ${book.title}`} className="ml-1 inline-grid size-8 place-items-center rounded-md border border-input align-middle hover:bg-muted">
          <Pencil className="size-3.5" />
        </Link>
      </td>
    </tr>
  );
}

export function BookQuickTable({ books }: { books: QuickBook[] }) {
  if (books.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No books found.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="pb-2">Book</th>
            <th className="pb-2">Price (Rs.)</th>
            <th className="pb-2">Disc. %</th>
            <th className="pb-2">Stock</th>
            <th className="pb-2 text-center">Active</th>
            <th className="pb-2 text-center">Featured</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {books.map((b) => (
            <BookQuickRow key={`${b.id}-${b.price}-${b.stock}-${b.discountPercent}-${b.isActive}-${b.isFeatured}`} book={b} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
