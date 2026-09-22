import type { Metadata } from "next";
import { BoxesIcon } from "lucide-react";

import { StockTable, type StockRow } from "@/components/admin/stock-table";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Kelola Stok" };

export default async function AdminStockPage() {
  const supabase = await createClient();
  const [{ data, error }, { data: categories }] = await Promise.all([
    supabase
      .from("stocks")
      .select("id_product, quantity, products(name, image_url, is_active, price, id_category)")
      .order("quantity", { ascending: true }),
    supabase.from("categories").select("id, name, description").order("name"),
  ]);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as StockRow[];
  const cats = (categories ?? []) as Pick<Category, "id" | "name">[];

  return (
    <>
      <PageHeader title="Kelola Stok" description="Catat stok masuk dan stok keluar untuk setiap menu." />

      {rows.length === 0 ? (
        <EmptyState icon={<BoxesIcon />} title="Belum ada data stok" description="Tambahkan menu terlebih dahulu." />
      ) : (
        <StockTable rows={rows} categories={cats} />
      )}
    </>
  );
}
