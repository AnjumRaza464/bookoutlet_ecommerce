import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = React.ComponentProps<"input"> & { label: string; error?: string; hint?: string };

export function Field({ label, error, hint, id, name, className, ...props }: FieldProps) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
        className="h-10 bg-white"
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-err`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = React.ComponentProps<"select"> & { label: string; error?: string; options: readonly { value: string; label: string }[] | readonly string[] };

export function SelectField({ label, error, options, id, name, className, ...props }: SelectFieldProps) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <select
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        className="h-10 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        {...props}
      >
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-brown px-6 text-sm font-bold tracking-wide text-brand-cream uppercase hover:bg-brand-black disabled:pointer-events-none disabled:opacity-60";
export const outlineBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-input bg-white px-6 text-sm font-semibold hover:bg-muted disabled:opacity-60";
