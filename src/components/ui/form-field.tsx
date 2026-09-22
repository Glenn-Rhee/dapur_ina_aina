import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Label + kontrol input + pesan error/petunjuk, dipakai di seluruh form. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[] | string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
