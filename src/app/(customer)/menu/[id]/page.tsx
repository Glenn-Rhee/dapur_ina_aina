import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { AddToCartButton } from "@/components/menu/add-to-cart-button";
import { ProductImage } from "@/components/menu/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, stockOf } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getProduct(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, id_category, name, description, price, image_url, is_active, categories(id, name), stocks(quantity)")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  return (data as unknown as Product | null) ?? null;
}

export async function generateMetadata(props: PageProps<"/menu/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getProduct(id);
  return { title: product?.name ?? "Detail Menu" };
}

export default async function MenuDetailPage(props: PageProps<"/menu/[id]">) {
  const { id } = await props.params;
  const product = await getProduct(id);
  if (!product) notFound();

  const stock = stockOf(product);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/menu">
          <ArrowLeftIcon /> Kembali ke menu
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <ProductImage src={product.image_url} alt={product.name} className="aspect-square" sizes="(min-width: 768px) 50vw, 100vw" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.categories && <Badge variant="secondary">{product.categories.name}</Badge>}
            {stock <= 0 ? (
              <Badge variant="destructive">Stok habis</Badge>
            ) : stock <= 5 ? (
              <Badge variant="warning">Tersisa {stock}</Badge>
            ) : (
              <Badge variant="success">Tersedia</Badge>
            )}
          </div>

          <h1 className="font-heading text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="font-heading text-2xl font-semibold text-primary">{formatRupiah(product.price)}</p>

          {product.description && (
            <p className="leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-2 border-t pt-6">
            <AddToCartButton
              variant="full"
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
      </div>
    </>
  );
}
