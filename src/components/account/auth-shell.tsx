import { LogoMark } from "@/components/brand/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-14">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl shadow-brand-brown/5 sm:p-10">
        <LogoMark className="mx-auto size-16" />
        <h1 className="mt-4 text-center text-3xl font-bold text-brand-black">{title}</h1>
        <p className="mt-1 mb-8 text-center text-sm text-muted-foreground">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
