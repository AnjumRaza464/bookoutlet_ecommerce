"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Field, SelectField, outlineBtn, primaryBtn } from "@/components/common/field";
import { api, FetchError } from "@/lib/fetcher";
import { PROVINCES } from "@/lib/constants";

function useSubmit() {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  async function run(fn: () => Promise<void>) {
    setPending(true);
    setErrors({});
    try {
      await fn();
    } catch (err) {
      if (err instanceof FetchError && err.fields) setErrors(err.fields);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }
  return { pending, errors, run };
}

export function ProfileForm({ initial }: { initial: { name: string; phone: string } }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const { pending, errors, run } = useSubmit();
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api("/api/account/profile", { method: "PATCH", body: v });
          toast.success("Profile updated");
          router.refresh();
        });
      }}
    >
      <Field label="Full name" name="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} />
      <Field label="Mobile number" name="phone" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} error={errors.phone} inputMode="tel" />
      <button disabled={pending} className={primaryBtn}>
        {pending && <Loader2 className="size-4 animate-spin" />} Save profile
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [v, setV] = useState({ currentPassword: "", newPassword: "" });
  const { pending, errors, run } = useSubmit();
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await api("/api/account/password", { method: "PATCH", body: v });
          toast.success("Password changed. Other devices have been signed out.");
          setV({ currentPassword: "", newPassword: "" });
        });
      }}
    >
      <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} error={errors.currentPassword} />
      <Field label="New password" name="newPassword" type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} error={errors.newPassword} hint="At least 8 characters with a letter and a number." />
      <button disabled={pending} className={primaryBtn}>
        {pending && <Loader2 className="size-4 animate-spin" />} Update password
      </button>
    </form>
  );
}

type Address = { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; province: string; postalCode: string | null; isDefault: boolean };

const EMPTY = { fullName: "", phone: "", line1: "", line2: "", city: "", province: "Punjab", postalCode: "" };

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState(EMPTY);
  const { pending, errors, run } = useSubmit();
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <div className="mt-4">
      {addresses.length === 0 && !adding && <p className="text-sm text-muted-foreground">No saved addresses yet.</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-xl border border-border p-4 text-sm">
            <p className="font-semibold">
              {a.fullName} {a.isDefault && <span className="ml-1 rounded-full bg-brand-cream px-2 py-0.5 text-xs text-brand-brown">Default</span>}
            </p>
            <p className="text-muted-foreground">
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
            </p>
            <p className="text-muted-foreground">
              {a.city}, {a.province} {a.postalCode}
            </p>
            <p className="text-muted-foreground">{a.phone}</p>
            <div className="mt-3 flex gap-3">
              {!a.isDefault && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-brown hover:underline"
                  onClick={() =>
                    run(async () => {
                      await api(`/api/account/addresses/${a.id}`, { method: "PATCH" });
                      router.refresh();
                    })
                  }
                >
                  <Star className="size-3.5" /> Make default
                </button>
              )}
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                onClick={() =>
                  run(async () => {
                    await api(`/api/account/addresses/${a.id}`, { method: "DELETE" });
                    toast.success("Address removed");
                    router.refresh();
                  })
                }
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      {adding ? (
        <form
          className="mt-6 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/api/account/addresses", { body: v });
              toast.success("Address saved");
              setV(EMPTY);
              setAdding(false);
              router.refresh();
            });
          }}
        >
          <Field label="Full name" name="a-fullName" value={v.fullName} onChange={set("fullName")} error={errors.fullName} />
          <Field label="Mobile number" name="a-phone" value={v.phone} onChange={set("phone")} error={errors.phone} inputMode="tel" />
          <Field label="House / street address" name="a-line1" value={v.line1} onChange={set("line1")} error={errors.line1} className="sm:col-span-2" />
          <Field label="Area / landmark (optional)" name="a-line2" value={v.line2} onChange={set("line2")} className="sm:col-span-2" />
          <Field label="City" name="a-city" value={v.city} onChange={set("city")} error={errors.city} />
          <SelectField label="Province / territory" name="a-province" value={v.province} onChange={set("province")} options={PROVINCES} error={errors.province} />
          <Field label="Postal code (optional)" name="a-postal" value={v.postalCode} onChange={set("postalCode")} error={errors.postalCode} inputMode="numeric" maxLength={5} />
          <div className="flex items-end gap-2 sm:col-span-2">
            <button disabled={pending} className={primaryBtn}>
              {pending && <Loader2 className="size-4 animate-spin" />} Save address
            </button>
            <button type="button" className={outlineBtn} onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={`${outlineBtn} mt-4`} onClick={() => setAdding(true)}>
          + Add address
        </button>
      )}
    </div>
  );
}
