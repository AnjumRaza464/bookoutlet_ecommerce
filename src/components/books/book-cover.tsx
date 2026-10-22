import Image from "next/image";
import { cn } from "@/lib/utils";

const PALETTES = [
  ["#4a2c1a", "#c08a43"],
  ["#15100d", "#e0b56a"],
  ["#6b4226", "#f1e3cd"],
  ["#2f3e2c", "#d9c08a"],
  ["#1f2f46", "#e0b56a"],
  ["#5a1f1f", "#f0c27b"],
  ["#3b2416", "#9fc5b8"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

type Props = {
  title: string;
  coverImage?: string | null;
  subject?: string;
  classLabel?: string;
  category?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Book cover: optimised image when available, otherwise a generated typographic cover. */
export function BookCover({ title, coverImage, subject, classLabel, category, className, sizes, priority }: Props) {
  if (coverImage) {
    return (
      <div className={cn("relative aspect-[3/4] overflow-hidden rounded-md bg-muted", className)}>
        <Image
          src={coverImage}
          alt={`Cover of ${title}`}
          fill
          sizes={sizes ?? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }
  const [bg, fg] = PALETTES[hash(subject ?? title) % PALETTES.length];
  return (
    <div
      role="img"
      aria-label={`Cover of ${title}`}
      className={cn("relative flex aspect-[3/4] flex-col overflow-hidden rounded-md p-[8%] shadow-inner", className)}
      style={{ background: `linear-gradient(150deg, ${bg} 0%, ${bg} 62%, color-mix(in oklab, ${bg}, black 35%) 100%)`, color: fg }}
    >
      <div className="absolute inset-y-0 left-0 w-[7%] bg-black/25" />
      <div className="absolute inset-x-[10%] top-[6%] h-px opacity-60" style={{ background: fg }} />
      <div className="relative flex items-center justify-between text-[0.6em] font-semibold tracking-[0.2em] uppercase opacity-90 sm:text-[0.65em]">
        <span>{classLabel}</span>
        <span>BNB</span>
      </div>
      <div className="relative my-auto py-2">
        <p className="font-heading line-clamp-4 text-[0.95em] leading-tight font-bold text-white sm:text-[1.05em]">{title}</p>
        {subject && <p className="mt-2 text-[0.7em] font-medium tracking-wide uppercase opacity-90">{subject}</p>}
      </div>
      <div className="relative flex items-center gap-2 text-[0.6em] tracking-widest uppercase opacity-80">
        <span className="h-px flex-1" style={{ background: fg }} />
        {category}
        <span className="h-px flex-1" style={{ background: fg }} />
      </div>
    </div>
  );
}
