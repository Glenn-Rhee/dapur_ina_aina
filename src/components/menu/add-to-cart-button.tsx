"use client";

import { useState } from "react";
import { CheckIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface Props {
  product: { id: string; name: string; price: number; image_url: string | null };
  stock: number;
  /** compact = tombol kecil untuk kartu; full = dengan pengatur jumlah (halaman detail) */
  variant?: "compact" | "full";
  className?: string;
}

export function AddToCartButton({ product, stock, variant = "compact", className }: Props) {
  const { addItem, items } = useCart();
  const [qty, setQty] = useState(1);
  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, stock - inCart);
  const soldOut = stock <= 0;

  function add(quantity: number) {
    const ok = addItem({ ...product, maxStock: stock, quantity });
    if (ok) toast.success(`${product.name} ditambahkan ke keranjang`);
    else toast.warning("Jumlah sudah mencapai stok yang tersedia");
  }

  if (variant === "compact") {
    return (
      <Button
        size="sm"
        className={className}
        disabled={soldOut || remaining <= 0}
        onClick={() => add(1)}
      >
        {soldOut ? (
          "Habis"
        ) : remaining <= 0 ? (
          <>
            <CheckIcon /> Di keranjang
          </>
        ) : (
          <>
            <PlusIcon /> Tambah
          </>
        )}
      </Button>
    );
  }

  const shown = Math.min(qty, Math.max(remaining, 1));

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="flex items-center rounded-md border">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Kurangi"
          disabled={soldOut || shown <= 1}
          onClick={() => setQty(Math.max(1, shown - 1))}
        >
          <MinusIcon />
        </Button>
        <span className="w-10 text-center text-sm font-medium tabular-nums">{shown}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Tambah"
          disabled={soldOut || shown >= remaining}
          onClick={() => setQty(shown + 1)}
        >
          <PlusIcon />
        </Button>
      </div>
      <Button
        size="lg"
        disabled={soldOut || remaining <= 0}
        onClick={() => {
          add(shown);
          setQty(1);
        }}
      >
        <ShoppingCartIcon />
        {soldOut ? "Stok habis" : remaining <= 0 ? "Sudah di keranjang" : "Tambah ke Keranjang"}
      </Button>
      {inCart > 0 && (
        <span className="text-sm text-muted-foreground">{inCart} sudah ada di keranjang</span>
      )}
    </div>
  );
}
