"use client";

import { useMemo, useState } from "react";
import { SearchIcon, SearchXIcon, XIcon } from "lucide-react";

import { deleteProduct } from "@/actions/admin";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ProductActiveSwitch } from "@/components/admin/product-active-switch";
import { ProductFormDialog } from "@/components/admin/product-form-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { ProductImage } from "@/components/menu/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatRupiah, stockOf } from "@/lib/format";
import type { Category, Product } from "@/types";

const STOCK_FILTERS = [
  { value: "all", label: "Semua stok" },
  { value: "available", label: "Tersedia (> 5)" },
  { value: "low", label: "Menipis (1-5)" },
  { value: "out", label: "Habis (0)" },
] as const;

type StockFilter = (typeof STOCK_FILTERS)[number]["value"];

export function MenuTable({
  products,
  categories,
}: {
  products: Product[];
  categories: Pick<Category, "id" | "name">[];
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (categoryId !== "all" && p.id_category !== categoryId) return false;

      const price = Number(p.price);
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;

      const stock = stockOf(p);
      if (stockFilter === "available" && stock <= 5) return false;
      if (stockFilter === "low" && (stock === 0 || stock > 5)) return false;
      if (stockFilter === "out" && stock !== 0) return false;

      return true;
    });
  }, [products, debouncedSearch, categoryId, minPrice, maxPrice, stockFilter]);

  const activeFilterCount =
    (categoryId !== "all" ? 1 : 0) + (minPrice !== "" ? 1 : 0) + (maxPrice !== "" ? 1 : 0) + (stockFilter !== "all" ? 1 : 0);

  function resetFilters() {
    setCategoryId("all");
    setMinPrice("");
    setMaxPrice("");
    setStockFilter("all");
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-xl border bg-card p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama menu..."
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="f-kategori" className="text-xs text-muted-foreground">
              Kategori
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="f-kategori" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="f-stok" className="text-xs text-muted-foreground">
              Stok
            </Label>
            <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
              <SelectTrigger id="f-stok" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="f-min" className="text-xs text-muted-foreground">
              Harga min
            </Label>
            <Input
              id="f-min"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Rp 0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="f-max" className="text-xs text-muted-foreground">
              Harga maks
            </Label>
            <Input
              id="f-max"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Tanpa batas"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              <XIcon /> Hapus filter ({activeFilterCount})
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan {filtered.length} dari {products.length} menu
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchXIcon />}
          title="Menu tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau filter."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Hapus semua filter
            </Button>
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
              {filtered.map((p) => {
                const stock = stockOf(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-md">
                          <ProductImage src={p.image_url} alt={p.name} sizes="48px" />
                        </div>
                        <span className="max-w-48 truncate font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.categories?.name ?? "-"}</TableCell>
                    <TableCell>{formatRupiah(p.price)}</TableCell>
                    <TableCell className={stock <= 5 ? "font-medium text-destructive" : ""}>{stock}</TableCell>
                    <TableCell>
                      <ProductActiveSwitch id={p.id} isActive={p.is_active} name={p.name} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ProductFormDialog product={p} categories={categories} />
                        <ConfirmDeleteButton
                          title={`Hapus "${p.name}"?`}
                          description="Menu yang sudah pernah dipesan tidak dapat dihapus; nonaktifkan saja."
                          onConfirm={() => deleteProduct(p.id)}
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
    </div>
  );
}
