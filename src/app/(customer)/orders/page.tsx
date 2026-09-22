import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, ReceiptTextIcon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatRupiah, one, orderCode, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

export const metadata: Metadata = { title: "Pesanan Saya" };

const TABS = [
  { key: "aktif", label: "Pesanan Aktif" },
  { key: "riwayat", label: "Riwayat Pesanan" },
] as const;

export default async function OrdersPage(props: PageProps<"/orders">) {
  const sp = await props.searchParams;
  const tab = (Array.isArray(sp.tab) ? sp.tab[0] : sp.tab) === "riwayat" ? "riwayat" : "aktif";

  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, id_user, order_date, total_amount, status, payments(id, payment_method, payment_status, amount, paid_at), order_details(id, quantity, price, subtotal, id_product, products(name, image_url))",
    )
    .eq("id_user", user.id)
    .order("order_date", { ascending: false });

  if (error) throw new Error(error.message);

  const all = (data ?? []) as unknown as Order[];
  const orders = all.filter((o) =>
    tab === "aktif" ? o.status === "pending" || o.status === "processing" : o.status === "completed" || o.status === "canceled",
  );

  return (
    <>
      <PageHeader title="Pesanan Saya" description="Pantau pesanan yang sedang berjalan dan lihat riwayat pesanan Anda." />

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "aktif" ? "/orders" : "/orders?tab=riwayat"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ReceiptTextIcon />}
          title={tab === "aktif" ? "Belum ada pesanan aktif" : "Belum ada riwayat pesanan"}
          description="Pesanan Anda akan muncul di sini setelah Anda memesan."
          action={
            <Button asChild>
              <Link href="/menu">Pesan Sekarang</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => {
            const pay = one(o.payments);
            const summary = o.order_details
              .map((d) => `${d.products?.name ?? "Menu"} ×${d.quantity}`)
              .join(", ");
            return (
              <Link key={o.id} href={`/orders/${o.id}`} className="group">
                <Card className="gap-3 p-4 transition-shadow group-hover:shadow-md sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-semibold">{orderCode(o.id)}</span>
                      <OrderStatusBadge status={o.status} />
                      {pay && <PaymentStatusBadge status={pay.payment_status} />}
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDateTime(o.order_date)}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {pay ? PAYMENT_METHOD_LABEL[pay.payment_method] : "-"}
                    </div>
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
