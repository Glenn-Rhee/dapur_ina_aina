"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { orderItemsSchema } from "@/lib/validations";
import type { PaymentMethod } from "@/types";

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };
export type SimpleResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Activity diagram "Pelanggan Memesan Menu":
 * validasi pembayaran & stok -> pesanan dibuat (semua dilakukan atomik oleh function create_order).
 */
export async function placeOrder(
  items: { product_id: string; quantity: number }[],
  method: PaymentMethod,
): Promise<PlaceOrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi Anda telah berakhir. Silakan masuk kembali." };

  if (method !== "CASH" && method !== "CASHLESS") {
    return { ok: false, error: "Metode pembayaran tidak valid." };
  }

  const parsed = orderItemsSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data pesanan tidak valid." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", {
    p_items: parsed.data,
    p_payment_method: method,
  });

  if (error || !data) {
    return {
      ok: false,
      error: error ? dbErrorMessage(error, "Pesanan gagal dibuat. Silakan coba lagi.") : "Pesanan gagal dibuat.",
    };
  }

  revalidatePath("/menu");
  revalidatePath("/orders");
  return { ok: true, orderId: data as string };
}

export async function cancelOrder(orderId: string): Promise<SimpleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi Anda telah berakhir. Silakan masuk kembali." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_my_order", { p_order_id: orderId });
  if (error) return { ok: false, error: dbErrorMessage(error, "Pesanan gagal dibatalkan.") };

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/menu");
  return { ok: true, message: "Pesanan berhasil dibatalkan." };
}
