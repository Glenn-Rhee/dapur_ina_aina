import Image from "next/image";
import { UtensilsCrossedIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden bg-muted", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-secondary/20 text-primary/60">
          <UtensilsCrossedIcon className="size-10" />
        </div>
      )}
    </div>
  );
}
