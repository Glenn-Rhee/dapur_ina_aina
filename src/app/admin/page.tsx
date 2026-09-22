import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangleIcon,
  BanknoteIcon,
  ClipboardListIcon,
  HourglassIcon,
  PackageIcon,
  UtensilsIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { AdminDashboard } from "@/types";

export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  { key: "orders_today" as const, label: "Pesanan Hari Ini", icon: ClipboardListIcon, format: "number" as const },
  { key: "revenue_today" as const, label: "Pendapatan Hari Ini", icon: BanknoteIcon, format: "rupiah" as const },
  { key: "pending_orders" as const, label: "Menunggu Diproses", icon: HourglassIcon, format: "number" as const },
  { key: "active_products" as const, label: "Menu Aktif", icon: UtensilsIcon, format: "number" as const },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard");
  if (error) throw new Error(error.message);

  const dashboard = data as AdminDashboard;

  return (
    <>
      <PageHeader title="Dashboard" description="Ringkasan operasional Toko Dapur Ina Aina hari ini." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          const value = dashboard[s.key];
          return (
            <Card key={s.key}>
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-heading text-xl font-semibold">
                    {s.format === "rupiah" ? formatRupiah(value) : value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sedang diproses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold">{dashboard.processing_orders}</p>
            <p className="mt-1 text-sm text-muted-foreground">pesanan sedang disiapkan</p>
            <Link href="/admin/transaksi" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Lihat semua transaksi &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Stok menipis</CardTitle>
            {dashboard.low_stock.length > 0 && <Badge variant="warning">{dashboard.low_stock.length}</Badge>}
          </CardHeader>
          <CardContent>
            {dashboard.low_stock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semua stok menu dalam kondisi aman.</p>
            ) : (
              <ul className="grid gap-2">
                {dashboard.low_stock.slice(0, 6).map((item) => (
                  <li key={item.id_product} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {item.quantity === 0 && <AlertTriangleIcon className="size-4 text-destructive" />}
                      {item.name}
                    </span>
                    <span className={item.quantity === 0 ? "font-semibold text-destructive" : "font-medium"}>
                      {item.quantity} tersisa
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/stok" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <PackageIcon className="size-3.5" /> Kelola stok
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
