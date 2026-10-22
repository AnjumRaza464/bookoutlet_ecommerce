import { cn } from "@/lib/utils";

/** BNB Book Outlet emblem: a brown badge with gold rings framing an open book and BNB monogram. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("size-12", className)} role="img" aria-label="BNB Book Outlet emblem">
      <circle cx="60" cy="60" r="58" fill="#15100d" />
      <circle cx="60" cy="60" r="52" fill="#4a2c1a" stroke="#e0b56a" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="#c08a43" strokeWidth="1" strokeDasharray="2 3" />
      <text x="60" y="54" textAnchor="middle" fontFamily="Georgia, 'Playfair Display', serif" fontWeight="700" fontSize="26" fill="#f8f3ec" letterSpacing="1">
        BNB
      </text>
      {/* open book */}
      <path d="M30 66 Q45 60 60 67 Q75 60 90 66 L90 86 Q75 80 60 87 Q45 80 30 86 Z" fill="#f8f3ec" />
      <path d="M60 67 L60 87" stroke="#c08a43" strokeWidth="2" />
      <path d="M35 71 Q46 67 56 72 M35 76 Q46 72 56 77 M64 72 Q74 67 85 71 M64 77 Q74 72 85 76" stroke="#c08a43" strokeWidth="1.3" fill="none" />
      <path d="M44 30 L60 22 L76 30" stroke="#e0b56a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-11 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-xl font-bold tracking-wide", inverted ? "text-brand-cream" : "text-brand-black")}>
          BNB <span className="text-brand-caramel">Book</span>
        </span>
        <span className={cn("text-[10px] font-semibold tracking-[0.32em] uppercase", inverted ? "text-brand-gold" : "text-brand-brown-light")}>
          Outlet
        </span>
      </span>
    </span>
  );
}
