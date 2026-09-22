"use client";

import Link from "next/link";
import { ShoppingBasketIcon, Trash2Icon } from "lucide-react";

import { ProductImage } from "@/components/menu/product-image";
import { EmptyState } from "@/components/layout/empty-state";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartSync } from "@/hooks/use-cart-sync";
import { formatRupiah } from "@/lib/format";

export function CartView() {
  const { items, totals, syncing, setQuantity, removeItem } = useCartSync();

  if (syncing) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasketIcon />}
        title="Keranjang masih kosong"
        description="Yuk pilih menu favorit Anda terlebih dahulu."
        action={
          <Button asChild>
            <Link href="/menu">Lihat Menu</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex-row items-center gap-4 p-3 sm:p-4">
            <div className="w-20 shrink-0 overflow-hidden rounded-lg sm:w-28">
              <ProductImage src={item.image_url} alt={item.name} sizes="112px" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-heading font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{formatRupiah(item.price)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Hapus ${item.name}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <QuantityStepper
                  value={item.quantity}
                  max={item.maxStock}
                  onChange={(n) => setQuantity(item.id, n)}
                />
                <span className="font-semibold">{formatRupiah(item.price * item.quantity)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Jumlah item</span>
            <span>{totals.count}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="font-heading text-xl font-semibold text-primary">{formatRupiah(totals.price)}</span>
          </div>
          <Button asChild size="lg" className="mt-2">
            <Link href="/checkout">Lanjut ke Pembayaran</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/menu">Tambah menu lain</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
