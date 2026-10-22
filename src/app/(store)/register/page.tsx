import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/auth-form";
import { AuthShell } from "@/components/account/auth-shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <AuthShell title="Create your account" subtitle="Order faster, save addresses and track every delivery.">
      <AuthForm mode="register" next={next} />
    </AuthShell>
  );
}
