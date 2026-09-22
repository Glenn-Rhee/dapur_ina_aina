import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, ClipboardListIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatRupiah, one, orderCode, PAYMENT_METHOD_LABEL } from "@/lib/format";
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

export default async function AdminTransactionsPage(props: PageProps<"/admin/transaksi">) {
  const sp = await props.searchParams;
  const status = Array.isArray(sp.status) ? sp.status[0] : (sp.status ?? "");

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, id_user, order_date, total_amount, status, users(name, email), payments(id, payment_method, payment_status, amount, paid_at), order_details(id, quantity, price, subtotal, id_product, products(name, image_url))",
    )
    .order("order_date", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status as OrderStatus);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const orders = (data ?? []) as unknown as Order[];

  return (
    <>
      <PageHeader title="Transaksi" description="Pantau dan kelola seluruh pesanan pelanggan." />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key || "all"}
            href={f.key ? `/admin/transaksi?status=${f.key}` : "/admin/transaksi"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              status === f.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ClipboardListIcon />} title="Belum ada transaksi" description="Transaksi pelanggan akan muncul di sini." />
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
