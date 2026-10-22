import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-cream p-8 text-center">
      <div>
        <LogoMark className="mx-auto size-20" />
        <h1 className="mt-6 text-4xl font-bold text-brand-black">Page not found</h1>
        <p className="mt-2 text-muted-foreground">This page is out of print.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand-brown px-6 text-sm font-bold text-brand-cream uppercase hover:bg-brand-black">
          Back to BNB Book Outlet
        </Link>
      </div>
    </main>
  );
}
