import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, ClipboardListIcon } from "lucide-react";

import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Card } from "@/components/ui/card";
import {
  daysAgoJakarta,
  formatDate,
  formatDateTime,
  formatRupiah,
  isValidDateStr,
  jakartaDayEnd,
  jakartaDayStart,
  one,
  orderCode,
  PAYMENT_METHOD_LABEL,
  todayJakarta,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Transaksi" };

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "processing", label: "Diproses" },
  { key: "completed", label: "Selesai" },
  { key: "canceled", label: "Dibatalkan" },
];

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminTransactionsPage(props: PageProps<"/admin/transaksi">) {
  const sp = await props.searchParams;
  const status = first(sp.status) ?? "";

  const defaultTo = todayJakarta();
  const defaultFrom = daysAgoJakarta(29); // 30 hari terakhir termasuk hari ini

  const rawFrom = first(sp.dari);
  const rawTo = first(sp.sampai);
  let from = isValidDateStr(rawFrom) ? rawFrom : defaultFrom;
  let to = isValidDateStr(rawTo) ? rawTo : defaultTo;
  if (from > to) [from, to] = [to, from]; // jaga-jaga jika terbalik

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, id_user, order_date, total_amount, status, users(name, email), payments(id, payment_method, payment_status, amount, paid_at), order_details(id, quantity, price, subtotal, id_product, products(name, image_url))",
    )
    .gte("order_date", jakartaDayStart(from))
    .lte("order_date", jakartaDayEnd(to))
    .order("order_date", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status as OrderStatus);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const orders = (data ?? []) as unknown as Order[];

  return (
    <>
      <PageHeader title="Transaksi" description="Pantau dan kelola seluruh pesanan pelanggan." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (f.key) params.set("status", f.key);
          if (from !== defaultFrom) params.set("dari", from);
          if (to !== defaultTo) params.set("sampai", to);
          const qs = params.toString();
          return (
            <Link
              key={f.key || "all"}
              href={qs ? `/admin/transaksi?${qs}` : "/admin/transaksi"}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                status === f.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-6">
        <DateRangeFilter status={status} from={from} to={to} defaultFrom={defaultFrom} defaultTo={defaultTo} />
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Menampilkan {orders.length} transaksi dari {formatDate(from)} sampai {formatDate(to)}
      </p>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardListIcon />}
          title="Tidak ada transaksi"
          description="Tidak ada transaksi pada rentang tanggal atau filter status ini."
        />
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => {
            const pay = one(o.payments);
            return (
              <Link key={o.id} href={`/admin/transaksi/${o.id}`} className="group">
                <Card className="gap-3 p-4 transition-shadow group-hover:shadow-md sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-semibold">{orderCode(o.id)}</span>
                      <OrderStatusBadge status={o.status} />
                      {pay && <PaymentStatusBadge status={pay.payment_status} />}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDateTime(o.order_date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {o.users?.name ?? "Pelanggan"} &middot; {pay ? PAYMENT_METHOD_LABEL[pay.payment_method] : "-"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{o.order_details.length} item</span>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-primary">{formatRupiah(o.total_amount)}</span>
                      <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
