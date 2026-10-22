"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field, primaryBtn } from "@/components/common/field";
import { api, FetchError } from "@/lib/fetcher";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      const body = mode === "login" ? { email: values.email, password: values.password } : values;
      const res = await api<{ user: { isStaff?: boolean } }>(`/api/auth/${mode}`, { body });
      toast.success(mode === "login" ? "Welcome back!" : "Account created — welcome to BNB Book Outlet!");
      const dest = next ? safeNext(next) : res.user.isStaff ? "/admin" : "/account";
      router.push(dest);
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setPending(false);
    }
  }

  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {mode === "register" && (
        <>
          <Field label="Full name" name="name" value={values.name} onChange={set("name")} error={errors.name} autoComplete="name" required />
          <Field label="Mobile number" name="phone" value={values.phone} onChange={set("phone")} error={errors.phone} placeholder="03001234567" inputMode="tel" autoComplete="tel" required />
        </>
      )}
      <Field label="Email" name="email" type="email" value={values.email} onChange={set("email")} error={errors.email} autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={set("password")}
        error={errors.password}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        hint={mode === "register" ? "At least 8 characters, including a letter and a number." : undefined}
        required
      />
      <button type="submit" disabled={pending} className={`${primaryBtn} w-full`}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New to BNB Book Outlet? <Link href={`/register${nextQs}`} className="font-semibold text-brand-brown hover:underline">Create an account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href={`/login${nextQs}`} className="font-semibold text-brand-brown hover:underline">Sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
