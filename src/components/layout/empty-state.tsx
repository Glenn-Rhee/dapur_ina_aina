import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground [&_svg]:size-7">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
