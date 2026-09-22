"use client";

import { useMemo, useState } from "react";
import { SearchIcon, SearchXIcon, XIcon } from "lucide-react";

import { StockAdjustDialog } from "@/components/admin/stock-adjust-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { ProductImage } from "@/components/menu/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatRupiah } from "@/lib/format";
import type { Category } from "@/types";

export interface StockRow {
  id_product: string;
  quantity: number;
  products: {
    name: string;
    image_url: string | null;
    is_active: boolean;
    price: number;
    id_category: string | null;
  } | null;
}

const STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  { value: "available", label: "Aman (> 5)" },
  { value: "low", label: "Menipis (1-5)" },
  { value: "out", label: "Habis (0)" },
  { value: "inactive", label: "Nonaktif" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export function StockTable({
  rows,
  categories,
}: {
  rows: StockRow[];
  categories: Pick<Category, "id" | "name">[];
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    return rows.filter((r) => {
      const name = r.products?.name ?? "";
      if (q && !name.toLowerCase().includes(q)) return false;
      if (categoryId !== "all" && r.products?.id_category !== categoryId) return false;

      const price = Number(r.products?.price ?? 0);
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;

      if (status === "inactive" && r.products?.is_active !== false) return false;
      if (status === "available" && (r.products?.is_active === false || r.quantity <= 5)) return false;
      if (status === "low" && (r.products?.is_active === false || r.quantity === 0 || r.quantity > 5)) return false;
      if (status === "out" && (r.products?.is_active === false || r.quantity !== 0)) return false;

      return true;
    });
  }, [rows, debouncedSearch, categoryId, status, minPrice, maxPrice]);

  const activeFilterCount =
    (categoryId !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0) + (minPrice !== "" ? 1 : 0) + (maxPrice !== "" ? 1 : 0);

  function resetFilters() {
    setCategoryId("all");
    setStatus("all");
    setMinPrice("");
    setMaxPrice("");
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
            <Label htmlFor="sf-kategori" className="text-xs text-muted-foreground">
              Kategori
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="sf-kategori" className="w-full">
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
            <Label htmlFor="sf-status" className="text-xs text-muted-foreground">
              Status stok
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger id="sf-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sf-min" className="text-xs text-muted-foreground">
              Harga min
            </Label>
            <Input
              id="sf-min"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Rp 0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sf-max" className="text-xs text-muted-foreground">
              Harga maks
            </Label>
            <Input
              id="sf-max"
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
        Menampilkan {filtered.length} dari {rows.length} menu
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchXIcon />}
          title="Data stok tidak ditemukan"
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
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stok saat ini</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id_product}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-12 shrink-0 overflow-hidden rounded-md">
                        <ProductImage src={r.products?.image_url ?? null} alt={r.products?.name ?? ""} sizes="48px" />
                      </div>
                      <span className="max-w-48 truncate font-medium">{r.products?.name ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatRupiah(r.products?.price ?? 0)}</TableCell>
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
    </div>
  );
}
