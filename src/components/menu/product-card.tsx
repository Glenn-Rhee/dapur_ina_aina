import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/menu/add-to-cart-button";
import { ProductImage } from "@/components/menu/product-image";
import { formatRupiah, stockOf } from "@/lib/format";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const stock = stockOf(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/menu/${product.id}`} className="relative block">
        <ProductImage src={product.image_url} alt={product.name} />
        {stock <= 0 ? (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Habis
          </Badge>
        ) : stock <= 5 ? (
          <Badge variant="warning" className="absolute top-2 left-2 bg-background/90">
            Sisa {stock}
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.categories && (
          <span className="text-xs font-medium text-secondary">{product.categories.name}</span>
        )}
        <Link href={`/menu/${product.id}`} className="font-heading leading-snug font-semibold hover:text-primary">
          {product.name}
        </Link>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-heading font-semibold text-primary">{formatRupiah(product.price)}</span>
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image_url: product.image_url,
            }}
            stock={stock}
          />
        </div>
      </div>
    </article>
  );
}
