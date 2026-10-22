"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/fetcher";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await api("/api/newsletter", { body: { email } });
      toast.success("Subscribed! We'll send you new arrivals and exam-season deals.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 text-sm text-brand-cream outline-none placeholder:text-brand-cream/50 focus:border-brand-gold"
      />
      <button disabled={pending} className="h-11 shrink-0 rounded-full bg-brand-caramel px-5 text-sm font-bold text-white uppercase hover:bg-brand-gold hover:text-brand-black disabled:opacity-60">
        {pending ? "…" : "Subscribe"}
      </button>
    </form>
  );
}
