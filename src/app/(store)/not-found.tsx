import Link from "next/link";
import { primaryBtn } from "@/components/common/field";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="font-heading text-8xl font-black text-brand-cream">404</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-black">This page is out of print</h1>
        <p className="mt-2 text-muted-foreground">The page or book you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
        <Link href="/books" className={`${primaryBtn} mt-6`}>Browse books</Link>
      </div>
    </div>
  );
}
