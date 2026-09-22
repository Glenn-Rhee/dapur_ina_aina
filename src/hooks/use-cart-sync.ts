"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/hooks/use-cart";
import { createClient } from "@/lib/supabase/client";
import { one } from "@/lib/format";
import type { CartItem } from "@/lib/cart-store";
import type { StockRow } from "@/types";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  stocks: StockRow | StockRow[] | null;
}

/**
 * Menyamakan isi keranjang dengan data terbaru di database (harga, stok, status aktif)
 * satu kali saat halaman keranjang / checkout dibuka.
 */
export function useCartSync() {
  const cart = useCart();
  const { ready, items, replaceAll } = cart;
  const [syncing, setSyncing] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;

    if (items.length === 0) {
      // Ditunda ke microtask agar tidak memicu setState sinkron di dalam effect.
      Promise.resolve().then(() => setSyncing(false));
      return;
    }

    const supabase = createClient();
    supabase
      .from("products")
      .select("id, name, price, image_url, is_active, stocks(quantity)")
      .in(
        "id",
        items.map((i) => i.id),
      )
      .then(({ data, error }) => {
        if (error || !data) {
          setSyncing(false);
          return;
        }

        const rows = new Map((data as ProductRow[]).map((p) => [p.id, p]));
        const removed: string[] = [];
        const clamped: string[] = [];
        const next: CartItem[] = [];

        for (const item of items) {
          const row = rows.get(item.id);
          const stock = row ? (one<StockRow>(row.stocks)?.quantity ?? 0) : 0;

          if (!row || !row.is_active || stock <= 0) {
            removed.push(item.name);
            continue;
          }

          const quantity = Math.min(item.quantity, stock);
          if (quantity < item.quantity) clamped.push(row.name);

          next.push({
            id: row.id,
            name: row.name,
            price: Number(row.price),
            image_url: row.image_url,
            maxStock: stock,
            quantity,
          });
        }

        replaceAll(next);
        if (removed.length) toast.warning(`Tidak tersedia & dihapus dari keranjang: ${removed.join(", ")}`);
        if (clamped.length) toast.info(`Jumlah disesuaikan dengan stok: ${clamped.join(", ")}`);
        setSyncing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { ...cart, syncing: syncing || !ready };
}
