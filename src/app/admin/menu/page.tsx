import type { Metadata } from "next";
import { UtensilsIcon } from "lucide-react";

import { MenuTable } from "@/components/admin/menu-table";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";

export const metadata: Metadata = { title: "Kelola Menu" };

export default async function AdminMenuPage() {
  const supabase = await createClient();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, id_category, name, description, price, image_url, is_active, categories(id, name), stocks(quantity)")
      .order("name"),
    supabase.from("categories").select("id, name, description").order("name"),
  ]);
  if (error) throw new Error(error.message);

  const list = (products ?? []) as unknown as Product[];
  const cats = (categories ?? []) as Pick<Category, "id" | "name">[];

  return (
    <>
      <PageHeader
        title="Kelola Menu"
        description="Tambah, ubah, dan atur menu yang tampil di halaman pelanggan."
        actions={<ProductFormDialog categories={cats} />}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<UtensilsIcon />}
          title="Belum ada menu"
          description={cats.length === 0 ? "Buat kategori terlebih dahulu, lalu tambahkan menu." : "Tambahkan menu pertama Anda."}
        />
      ) : (
        <MenuTable products={list} categories={cats} />
      )}
    </>
  );
}
