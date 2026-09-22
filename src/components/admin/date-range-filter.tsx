"use client";

import { CalendarIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateRangeFilter({
  status,
  from,
  to,
  defaultFrom,
  defaultTo,
}: {
  status: string;
  from: string;
  to: string;
  defaultFrom: string;
  defaultTo: string;
}) {
  const isDefault = from === defaultFrom && to === defaultTo;

  return (
    <form action="/admin/transaksi" className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
      {status && <input type="hidden" name="status" value={status} />}

      <div className="grid gap-1.5">
        <Label htmlFor="dari" className="text-xs text-muted-foreground">
          Dari tanggal
        </Label>
        <Input id="dari" name="dari" type="date" defaultValue={from} max={to} className="w-40" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="sampai" className="text-xs text-muted-foreground">
          Sampai tanggal
        </Label>
        <Input id="sampai" name="sampai" type="date" defaultValue={to} min={from} className="w-40" />
      </div>

      <Button type="submit" size="sm">
        <CalendarIcon /> Terapkan
      </Button>

      {!isDefault && (
        <Button asChild type="button" variant="ghost" size="sm">
          <a href={status ? `/admin/transaksi?status=${status}` : "/admin/transaksi"}>
            <RotateCcwIcon /> 30 hari terakhir
          </a>
        </Button>
      )}
    </form>
  );
}
