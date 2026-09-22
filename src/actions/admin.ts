"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, productSchema, stockAdjustSchema } from "@/lib/validations";
import type { ActionState, OrderStatus, PaymentStatus } from "@/types";
import type { SimpleResult } from "@/actions/orders";

const emptyToUndefined = (v: FormDataEntryValue | null) => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
};

function revalidateCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/menu");
  revalidatePath("/admin/stok");
  revalidatePath("/admin/kategori");
  revalidatePath("/menu");
}

function revalidateSales() {
  revalidatePath("/admin");
  revalidatePath("/admin/transaksi");
  revalidatePath("/admin/laporan");
  revalidatePath("/orders");
}

/* ------------------------------ KATEGORI ------------------------------ */

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    id: emptyToUndefined(formData.get("id")),
    name: formData.get("name"),
    description: emptyToUndefined(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, name, description } = parsed.data;
  const supabase = await createClient();
  const payload = { name, description: description ?? null };

  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert(payload);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Nama kategori sudah digunakan."
          : dbErrorMessage(error, "Kategori gagal disimpan."),
    };
  }

  revalidateCatalog();
  return { ok: true, message: id ? "Kategori diperbarui." : "Kategori ditambahkan." };
}

export async function deleteCategory(id: string): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Kategori masih dipakai oleh menu. Pindahkan atau hapus menunya terlebih dahulu."
          : dbErrorMessage(error, "Kategori gagal dihapus."),
    };
  }

  revalidateCatalog();
  return { ok: true, message: "Kategori dihapus." };
}

/* -------------------------------- PRODUK -------------------------------- */

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: emptyToUndefined(formData.get("id")),
    name: formData.get("name"),
    id_category: formData.get("id_category"),
    description: emptyToUndefined(formData.get("description")),
    price: formData.get("price"),
    image_url: emptyToUndefined(formData.get("image_url")),
    is_active: formData.get("is_active") === "on",
    initial_stock: emptyToUndefined(formData.get("initial_stock")),
  });
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { id, initial_stock, ...rest } = parsed.data;
  const payload = {
    id_category: rest.id_category,
    name: rest.name,
    description: rest.description ?? null,
    price: rest.price,
    image_url: rest.image_url ?? null,
    is_active: rest.is_active,
  };

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: dbErrorMessage(error, "Menu gagal disimpan.") };
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error || !data) return { error: dbErrorMessage(error ?? { message: "" }, "Menu gagal disimpan.") };

    if (initial_stock && initial_stock > 0) {
      await supabase.rpc("admin_adjust_stock", {
        p_product_id: data.id,
        p_action: "add",
        p_quantity: initial_stock,
      });
    }
  }

  revalidateCatalog();
  return { ok: true, message: id ? "Menu diperbarui." : "Menu ditambahkan." };
}

export async function toggleProductActive(id: string, isActive: boolean): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: dbErrorMessage(error, "Status menu gagal diubah.") };

  revalidateCatalog();
  return { ok: true, message: isActive ? "Menu diaktifkan." : "Menu dinonaktifkan." };
}

export async function deleteProduct(id: string): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return {
      ok: false,
      error:
        error.code === "23503"
          ? "Menu ini sudah pernah dipesan sehingga tidak bisa dihapus. Nonaktifkan saja agar tidak tampil di daftar menu."
          : dbErrorMessage(error, "Menu gagal dihapus."),
    };
  }

  revalidateCatalog();
  return { ok: true, message: "Menu dihapus." };
}

/* --------------------------------- STOK --------------------------------- */

/** Activity diagram "Admin Mengelola Stok": pilih produk -> tambah/kurang -> validasi -> simpan. */
export async function adjustStock(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = stockAdjustSchema.safeParse({
    product_id: formData.get("product_id"),
    action: formData.get("action"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_adjust_stock", {
    p_product_id: parsed.data.product_id,
    p_action: parsed.data.action,
    p_quantity: parsed.data.quantity,
  });
  if (error) return { error: dbErrorMessage(error, "Stok gagal diperbarui.") };

  revalidateCatalog();
  return { ok: true, message: `Stok diperbarui. Stok sekarang: ${data}.` };
}

/* ------------------------------- TRANSAKSI ------------------------------ */

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) return { ok: false, error: dbErrorMessage(error, "Status pesanan gagal diubah.") };

  revalidateSales();
  revalidatePath(`/admin/transaksi/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/stok");
  return { ok: true, message: "Status pesanan diperbarui." };
}

export async function updatePaymentStatus(
  orderId: string,
  status: PaymentStatus,
): Promise<SimpleResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_payment_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) return { ok: false, error: dbErrorMessage(error, "Status pembayaran gagal diubah.") };

  revalidateSales();
  revalidatePath(`/admin/transaksi/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: "Status pembayaran diperbarui." };
}
