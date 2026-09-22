import type { Metadata } from "next";
import { BoxesIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { StockAdjustDialog } from "@/components/admin/stock-adjust-dialog";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/menu/product-image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kelola Stok" };

interface StockRow {
  id_product: string;
  quantity: number;
  products: { name: string; image_url: string | null; is_active: boolean } | null;
}

export default async function AdminStockPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stocks")
    .select("id_product, quantity, products(name, image_url, is_active)")
    .order("quantity", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as StockRow[];

  return (
    <>
      <PageHeader title="Kelola Stok" description="Catat stok masuk dan stok keluar untuk setiap menu." />

      {rows.length === 0 ? (
        <EmptyState icon={<BoxesIcon />} title="Belum ada data stok" description="Tambahkan menu terlebih dahulu." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stok saat ini</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id_product}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-md">
                        <ProductImage src={r.products?.image_url ?? null} alt={r.products?.name ?? ""} sizes="48px" />
                      </div>
                      <span className="max-w-48 truncate font-medium">{r.products?.name ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {!r.products?.is_active ? (
                      <Badge variant="muted">Nonaktif</Badge>
                    ) : r.quantity === 0 ? (
                      <Badge variant="destructive">Habis</Badge>
                    ) : r.quantity <= 5 ? (
                      <Badge variant="warning">Menipis</Badge>
                    ) : (
                      <Badge variant="success">Aman</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">{r.quantity}</TableCell>
                  <TableCell className="text-right">
                    <StockAdjustDialog product={{ id: r.id_product, name: r.products?.name ?? "-", quantity: r.quantity }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
