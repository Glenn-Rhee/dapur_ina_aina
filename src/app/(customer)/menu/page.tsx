import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon, SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ProductCard } from "@/components/menu/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

export const metadata: Metadata = { title: "Menu" };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function MenuPage(props: PageProps<"/menu">) {
  const sp = await props.searchParams;
  const kategori = first(sp.kategori) ?? "";
  // buang karakter yang punya arti khusus di filter PostgREST
  const q = (first(sp.q) ?? "").replace(/[%,()*\\]/g, " ").trim();

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, id_category, name, description, price, image_url, is_active, categories(id, name), stocks(quantity)")
    .eq("is_active", true)
    .order("name");

  if (kategori) query = query.eq("id_category", kategori);
  if (q) query = query.ilike("name", `%${q}%`);

  const [{ data: products, error }, { data: categories }] = await Promise.all([
    query,
    supabase.from("categories").select("id, name, description").order("name"),
  ]);

  if (error) throw new Error(error.message);

  const list = (products ?? []) as unknown as Product[];
  const cats = (categories ?? []) as Category[];

  const href = (id: string) => {
    const params = new URLSearchParams();
    if (id) params.set("kategori", id);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/menu?${s}` : "/menu";
  };

  return (
    <>
      <PageHeader title="Menu" description="Pilih makanan, menu tambahan, dan minuman favorit Anda." />

      <div className="mb-6 grid gap-4">
        <form action="/menu" className="flex gap-2">
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          <div className="relative max-w-md flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Cari menu..." className="pl-9" />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {[{ id: "", name: "Semua" }, ...cats].map((c) => (
            <Link
              key={c.id || "all"}
              href={href(c.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                kategori === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-accent",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<SearchXIcon />}
          title="Menu tidak ditemukan"
          description="Coba kata kunci atau kategori lain."
          action={
            <Button asChild variant="outline">
              <Link href="/menu">Tampilkan semua menu</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
