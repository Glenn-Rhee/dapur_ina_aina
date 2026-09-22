import type { Metadata } from "next";
import { UtensilsIcon } from "lucide-react";

import { deleteProduct } from "@/actions/admin";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ProductActiveSwitch } from "@/components/admin/product-active-switch";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ProductImage } from "@/components/menu/product-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, stockOf } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types";

export const metadata: Metadata = { title: "Kelola Menu" };

export default async function AdminMenuPage() {
  const supabase = await createClient();
  const [{ data: products, error }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, id_category, name, description, price, image_url, is_active, categories(id, name), stocks(quantity)",
      )
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
          description={
            cats.length === 0
              ? "Buat kategori terlebih dahulu, lalu tambahkan menu."
              : "Tambahkan menu pertama Anda."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Tampil</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => {
                const stock = stockOf(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-md">
                          <ProductImage
                            src={p.image_url}
                            alt={p.name}
                            sizes="48px"
                          />
                        </div>
                        <span className="max-w-48 truncate font-medium">
                          {p.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.categories?.name ?? "-"}
                    </TableCell>
                    <TableCell>{formatRupiah(p.price)}</TableCell>
                    <TableCell
                      className={
                        stock <= 5 ? "font-medium text-destructive" : ""
                      }
                    >
                      {stock}
                    </TableCell>
                    <TableCell>
                      <ProductActiveSwitch
                        id={p.id}
                        isActive={p.is_active}
                        name={p.name}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ProductFormDialog product={p} categories={cats} />
                        <ConfirmDeleteButton
                          id={p.id}
                          usedFor="product"
                          title={`Hapus "${p.name}"?`}
                          description="Menu yang sudah pernah dipesan tidak dapat dihapus; nonaktifkan saja."
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
