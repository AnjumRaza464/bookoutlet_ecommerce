"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, FetchError } from "@/lib/fetcher";
import { CLASSES } from "@/lib/constants";
import { effectivePrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { BookCover } from "@/components/books/book-cover";
import { adminBtn, adminBtnOutline, adminInput, Panel } from "./ui";

type Option = { id: string; name: string };
export type BookFormValues = {
  title: string;
  slug: string;
  description: string;
  author: string;
  isbn: string;
  sku: string;
  classLevel: number;
  medium: string;
  edition: string;
  pages: number | "";
  coverImage: string;
  price: number;
  discountPercent: number;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
  boardId: string;
  subjectId: string;
  publisherId: string;
};

export function BookForm({
  bookId,
  initial,
  options,
}: {
  bookId?: string;
  initial: BookFormValues;
  options: { categories: Option[]; boards: Option[]; subjects: Option[]; publishers: Option[] };
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof BookFormValues>(k: K, val: BookFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const text = (k: keyof BookFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never);
  const int = (k: keyof BookFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(k, (e.target.value === "" ? "" : Math.floor(Number(e.target.value))) as never);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const body = { ...v, slug: v.slug || slugify(v.title) };
      if (bookId) {
        await api(`/api/admin/books/${bookId}`, { method: "PUT", body });
        toast.success("Book updated");
        router.refresh();
      } else {
        const res = await api<{ book: { id: string } }>("/api/admin/books", { body });
        toast.success("Book created");
        router.push(`/admin/books/${res.book.id}`);
      }
    } catch (err) {
      if (err instanceof FetchError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Could not save book");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!bookId) return;
    setDeleting(true);
    try {
      const r = await api<{ archived?: boolean; message?: string }>(`/api/admin/books/${bookId}`, { method: "DELETE" });
      toast.success(r.archived ? r.message! : "Book deleted");
      router.push("/admin/books");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
      setDeleting(false);
    }
  }

  const inputCls = `${adminInput} w-full`;

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-6">
        <Panel title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <FW errors={errors} k="title" label="Title" className="sm:col-span-2">
              <input id="b-title" value={v.title} onChange={text("title")} className={inputCls} required />
            </FW>
            <FW errors={errors} k="slug" label="URL slug (auto from title if empty)">
              <input id="b-slug" value={v.slug} onChange={text("slug")} placeholder={slugify(v.title)} className={inputCls} />
            </FW>
            <FW errors={errors} k="sku" label="SKU">
              <input id="b-sku" value={v.sku} onChange={text("sku")} className={`${inputCls} uppercase`} required />
            </FW>
            <FW errors={errors} k="author" label="Author (optional)">
              <input id="b-author" value={v.author} onChange={text("author")} className={inputCls} />
            </FW>
            <FW errors={errors} k="isbn" label="ISBN (optional)">
              <input id="b-isbn" value={v.isbn} onChange={text("isbn")} className={inputCls} />
            </FW>
            <FW errors={errors} k="description" label="Description" className="sm:col-span-2">
              <textarea id="b-description" value={v.description} onChange={text("description")} rows={5} className={`${inputCls} h-auto py-2`} />
            </FW>
          </div>
        </Panel>
        <Panel title="Classification">
          <div className="grid gap-4 sm:grid-cols-3">
            <FW errors={errors} k="classLevel" label="Class">
              <select id="b-classLevel" value={v.classLevel} onChange={int("classLevel")} className={inputCls}>
                {CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FW>
            {(["categoryId", "boardId", "subjectId", "publisherId"] as const).map((k) => {
              const map = { categoryId: ["Category", options.categories], boardId: ["Board", options.boards], subjectId: ["Subject", options.subjects], publisherId: ["Publisher", options.publishers] } as const;
              const [label, opts] = map[k];
              return (
                <FW key={k} errors={errors} k={k} label={label}>
                  <select id={`b-${k}`} value={v[k]} onChange={text(k)} className={inputCls}>
                    <option value="">Select…</option>
                    {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </FW>
              );
            })}
            <FW errors={errors} k="medium" label="Medium">
              <select id="b-medium" value={v.medium} onChange={text("medium")} className={inputCls}>
                {["English", "Urdu", "Bilingual"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </FW>
            <FW errors={errors} k="edition" label="Edition">
              <input id="b-edition" value={v.edition} onChange={text("edition")} className={inputCls} />
            </FW>
            <FW errors={errors} k="pages" label="Pages">
              <input id="b-pages" type="number" min={1} value={v.pages} onChange={int("pages")} className={inputCls} />
            </FW>
          </div>
        </Panel>
        <Panel title="Cover image">
          <FW errors={errors} k="coverImage" label="Image URL (https). Leave empty to use a generated cover.">
            <input id="b-coverImage" value={v.coverImage} onChange={text("coverImage")} placeholder="https://res.cloudinary.com/…/cover.jpg" className={inputCls} />
          </FW>
          <p className="mt-2 text-xs text-muted-foreground">Allowed hosts: Cloudinary, Vercel Blob, Unsplash, Imgur, plus any in the IMAGE_HOSTS env variable. Images are optimised automatically (AVIF/WebP).</p>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Pricing & stock">
          <div className="grid grid-cols-2 gap-4">
            <FW errors={errors} k="price" label="Price (Rs.)">
              <input id="b-price" type="number" min={1} value={v.price} onChange={int("price")} className={inputCls} />
            </FW>
            <FW errors={errors} k="discountPercent" label="Discount %">
              <input id="b-discountPercent" type="number" min={0} max={90} value={v.discountPercent} onChange={int("discountPercent")} className={inputCls} />
            </FW>
            <FW errors={errors} k="stock" label="Stock">
              <input id="b-stock" type="number" min={0} value={v.stock} onChange={int("stock")} className={inputCls} />
            </FW>
            <FW errors={errors} k="lowStockAlert" label="Low-stock alert">
              <input id="b-lowStockAlert" type="number" min={0} value={v.lowStockAlert} onChange={int("lowStockAlert")} className={inputCls} />
            </FW>
          </div>
          <p className="mt-3 text-sm">Selling price: <strong>{formatPKR(effectivePrice({ price: Number(v.price) || 0, discountPercent: Number(v.discountPercent) || 0 }))}</strong></p>
          <div className="mt-4 space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} className="size-4 accent-[#4a2c1a]" /> Visible in store</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={v.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="size-4 accent-[#4a2c1a]" /> Featured on homepage</label>
          </div>
        </Panel>
        <Panel title="Preview">
          <div className="mx-auto w-40 text-xs">
            <BookCover title={v.title || "Book title"} coverImage={null}subject={options.subjects.find((s) => s.id === v.subjectId)?.name} classLabel={`Class ${v.classLevel}`} category={options.categories.find((c) => c.id === v.categoryId)?.name} />
          </div>
          {v.coverImage && <p className="mt-2 text-center text-xs text-muted-foreground">Custom cover image is shown in the store.</p>}
        </Panel>
        <div className="flex flex-wrap gap-2">
          <button disabled={saving} className={`${adminBtn} flex-1`}>
            {saving && <Loader2 className="size-4 animate-spin" />} {bookId ? "Save changes" : "Create book"}
          </button>
          <button type="button" onClick={() => router.push("/admin/books")} className={adminBtnOutline}>Cancel</button>
        </div>
        {bookId &&
          (confirmDelete ? (
            <div className="rounded-lg border border-destructive/30 bg-red-50 p-3 text-sm">
              <p>Delete this book? Books with order history are hidden instead.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={remove} disabled={deleting} className="inline-flex h-8 items-center gap-1 rounded-md bg-destructive px-3 text-xs font-semibold text-white">
                  {deleting && <Loader2 className="size-3 animate-spin" />} Delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-8 rounded-md border border-input bg-white px-3 text-xs font-semibold">Keep</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline">
              <Trash2 className="size-4" /> Delete book
            </button>
          ))}
      </div>
    </form>
  );
}

function FW({ k, label, errors, children, className }: { k: string; label: string; errors: Record<string, string>; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label htmlFor={`b-${k}`} className="text-sm font-medium">{label}</label>
      {children}
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );
}
