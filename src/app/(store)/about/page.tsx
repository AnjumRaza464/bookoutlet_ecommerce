import type { Metadata } from "next";
import Link from "next/link";
import { BookStackArt } from "@/components/home/book-stack-art";
import { primaryBtn } from "@/components/common/field";

export const metadata: Metadata = {
  title: "About us",
  description: "BNB Book Outlet is an online bookstore for Matric and Intermediate students across Pakistan.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page grid items-center gap-12 py-16 md:grid-cols-2">
      <div>
        <p className="text-xs font-bold tracking-[0.3em] text-brand-caramel uppercase">About BNB Book Outlet</p>
        <h1 className="mt-2 text-4xl font-bold text-brand-black sm:text-5xl">Books that help Pakistan&apos;s students succeed</h1>
        <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
          <p>
            BNB Book Outlet was started with one goal: make it easy for every Matric and Intermediate student in Pakistan to get the right
            books on time. Instead of searching shop to shop in Urdu Bazar, students and parents can order the complete set for their class
            and board online.
          </p>
          <p>
            We stock board-prescribed textbooks for Class 9 to 12, along with trusted guides, keybooks, chapter-wise notes and solved past
            papers for the Federal Board and provincial boards across Punjab, Sindh, Khyber Pakhtunkhwa and Balochistan.
          </p>
          <p>Every order is checked, packed carefully and dispatched with tracking to anywhere in the country.</p>
        </div>
        <Link href="/books" className={`${primaryBtn} mt-8`}>Explore the catalogue</Link>
      </div>
      <div className="rounded-3xl bg-gradient-to-br from-brand-brown to-brand-black p-10">
        <BookStackArt className="w-full" />
      </div>
    </div>
  );
}
