import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CircleCheckIcon, InfoIcon } from "lucide-react";

import { OrderItemsCard } from "@/components/orders/order-items-card";
import { CancelOrderButton } from "@/components/orders/cancel-order-button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/status-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatRupiah, one, orderCode, PAYMENT_METHOD_LABEL } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const isNew = (Array.isArray(sp.baru) ? sp.baru[0] : sp.baru) === "1";

  if (!UUID.test(id)) notFound();

  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, id_user, order_date, total_amount, status, payments(id, payment_method, payment_status, amount, paid_at), order_details(id, quantity, price, subtotal, id_product, products(name, image_url))",
    )
    .eq("id", id)
    .eq("id_user", user.id)
    .maybeSingle();

  const order = data as unknown as Order | null;
  if (!order) notFound();

  const pay = one(order.payments);
  const canCancel = order.status === "pending" && pay?.payment_status !== "PAID";

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/orders">
          <ArrowLeftIcon /> Kembali ke pesanan
        </Link>
      </Button>

      {isNew && (
        <Alert variant="success" className="mb-6">
          <CircleCheckIcon />
          <AlertTitle>Pesanan berhasil dibuat!</AlertTitle>
          <AlertDescription>
            {pay?.payment_method === "CASH"
              ? "Silakan lakukan pembayaran tunai di toko saat mengambil pesanan."
              : "Silakan selesaikan pembayaran non-tunai. Admin akan mengonfirmasi pembayaran Anda."}
          </AlertDescription>
        </Alert>
      )}

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
        <OrderItemsCard order={order} />

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode</span>
                <span className="font-medium">{pay ? PAYMENT_METHOD_LABEL[pay.payment_method] : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-medium">{formatRupiah(pay?.amount ?? order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibayar pada</span>
                <span className="font-medium">{pay?.paid_at ? formatDateTime(pay.paid_at) : "-"}</span>
              </div>
            </CardContent>
          </Card>

          {order.status === "pending" && pay?.payment_status === "PENDING" && !isNew && (
            <Alert variant="info">
              <InfoIcon />
              <AlertDescription>
                {pay.payment_method === "CASH"
                  ? "Bayar tunai di toko saat mengambil pesanan."
                  : "Menunggu konfirmasi pembayaran dari admin."}
              </AlertDescription>
            </Alert>
          )}

          {canCancel && <CancelOrderButton orderId={order.id} />}
        </div>
      </div>
    </>
  );
}
