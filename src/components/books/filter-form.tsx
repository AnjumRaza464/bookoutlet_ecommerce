"use client";

import { useRouter } from "next/navigation";

/** GET form that applies filters immediately on change (still works without JS via the submit button). */
export function AutoSubmitForm({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  return (
    <form
      action="/books"
      className={className}
      onChange={(e) => {
        const target = e.target as unknown as HTMLInputElement;
        if (target.type === "number" || target.type === "search") return;
        const form = e.currentTarget;
        const sp = new URLSearchParams();
        new FormData(form).forEach((v, k) => {
          if (typeof v === "string" && v !== "") sp.set(k, v);
        });
        router.push(`/books${sp.size ? `?${sp}` : ""}`, { scroll: false });
      }}
    >
      {children}
    </form>
  );
}
