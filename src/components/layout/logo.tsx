import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <UtensilsCrossed className="size-5" />
      </span>
      {showText && (
        <span className="font-heading text-lg leading-none font-semibold tracking-tight">
          Dapur <span className="text-primary">Ina Aina</span>
        </span>
      )}
    </Link>
  );
}
