import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/auth-form";
import { AuthShell } from "@/components/account/auth-shell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/account");
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to check out, track orders and manage your wishlist.">
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
