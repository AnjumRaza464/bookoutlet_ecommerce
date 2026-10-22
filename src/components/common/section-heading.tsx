import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, text, className, align = "center" }: { eyebrow?: string; title: string; text?: string; className?: string; align?: "center" | "left" }) {
  return (
    <div className={cn("mb-10", align === "center" ? "text-center" : "text-left", className)}>
      {eyebrow && <p className="mb-2 text-xs font-bold tracking-[0.3em] text-brand-caramel uppercase">{eyebrow}</p>}
      <h2 className="text-3xl font-bold text-brand-black sm:text-4xl">{title}</h2>
      <div className={cn("mt-3 flex items-center gap-2", align === "center" && "justify-center")}>
        <span className="h-px w-10 bg-brand-caramel" />
        <span className="size-1.5 rotate-45 bg-brand-caramel" />
        <span className="h-px w-10 bg-brand-caramel" />
      </div>
      {text && <p className={cn("mt-4 text-muted-foreground", align === "center" && "mx-auto max-w-2xl")}>{text}</p>}
    </div>
  );
}
