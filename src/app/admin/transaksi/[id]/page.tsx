import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { OrderAdminControls } from "@/components/admin/order-admin-controls";
import { OrderItemsCard } from "@/components/orders/order-items-card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, one, orderCode, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: "Detail Transaksi" };

export default async function AdminTransactionDetailPage(props: PageProps<"/admin/transaksi/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, id_user, order_date, total_amount, status, users(name, email), payments(id, payment_method, payment_status, amount, paid_at), order_details(id, quantity, price, subtotal, id_product, products(name, image_url))",
    )
    .eq("id", id)
    .maybeSingle();

  const order = data as unknown as Order | null;
  if (!order) notFound();

  const pay = one(order.payments);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin/transaksi">
          <ArrowLeftIcon /> Kembali ke transaksi
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">{orderCode(order.id)}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.order_date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {pay && <PaymentStatusBadge status={pay.payment_status} />}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p className="font-medium">{order.users?.name ?? "-"}</p>
              <p className="text-muted-foreground">{order.users?.email ?? "-"}</p>
              <p className="mt-2 text-muted-foreground">
                Metode pembayaran: {pay ? PAYMENT_METHOD_LABEL[pay.payment_method] : "-"}
              </p>
            </CardContent>
          </Card>
          <OrderItemsCard order={order} />
        </div>

        <OrderAdminControls orderId={order.id} status={order.status} paymentStatus={pay?.payment_status ?? null} />
      </div>
    </>
  );
}
