import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { SITE } from "@/lib/constants";
import "./globals.css";

const display = Playfair_Display({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });
const body = Poppins({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Matric & Intermediate Books Online in Pakistan`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Buy Class 9, 10, 11 and 12 textbooks, guides, notes and solved past papers for all Pakistani boards. PKR prices, Easypaisa & Cash on Delivery, nationwide delivery.",
  keywords: ["matric books", "intermediate books", "class 9 books", "1st year books", "past papers", "FBISE", "BISE Lahore", "Pakistan bookstore"],
  openGraph: { type: "website", siteName: SITE.name, locale: "en_PK" },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#15100d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
