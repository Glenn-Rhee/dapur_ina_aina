import type { Metadata } from "next";
import { TagsIcon } from "lucide-react";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Kategori" };

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, name, description").order("name");
  if (error) throw new Error(error.message);

  const categories = (data ?? []) as Category[];

  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kelompokkan menu ke dalam kategori seperti Makanan, Menu Tambahan, dan Minuman."
        actions={<CategoryFormDialog />}
      />

      {categories.length === 0 ? (
        <EmptyState icon={<TagsIcon />} title="Belum ada kategori" description="Tambahkan kategori pertama Anda." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-heading font-semibold">{c.name}</p>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CategoryFormDialog category={c} />
                  <ConfirmDeleteButton
                    title={`Hapus "${c.name}"?`}
                    usedFor="category"
                    id={c.id}
                    description="Kategori yang masih dipakai oleh menu tidak dapat dihapus."
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
