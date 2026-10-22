import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your BNB Book Outlet order with your order number and mobile number.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <p className="text-xs font-bold tracking-[0.3em] text-brand-caramel uppercase">Order tracking</p>
      <h1 className="mt-1 text-4xl font-bold text-brand-black">Where are my books?</h1>
      <p className="mt-2 text-muted-foreground">Enter the order number from your confirmation and the mobile number used at checkout.</p>
      <TrackForm />
    </div>
  );
}
