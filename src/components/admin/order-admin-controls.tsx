"use client";

import { useTransition } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { updateOrderStatus, updatePaymentStatus } from "@/actions/admin";
import type { SimpleResult } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderStatus, PaymentStatus } from "@/types";

export function OrderAdminControls({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus | null;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<SimpleResult>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message);
      else toast.error(res.error);
    });
  }

  const finished = status === "completed" || status === "canceled";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola transaksi</CardTitle>
        <CardDescription>
          {finished ? "Pesanan ini sudah final dan tidak dapat diubah." : "Perbarui status pembayaran dan pesanan."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {paymentStatus && status !== "canceled" && (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Pembayaran</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={paymentStatus === "PAID" ? "secondary" : "default"}
                disabled={pending || paymentStatus === "PAID"}
                onClick={() => run(() => updatePaymentStatus(orderId, "PAID"))}
              >
                Tandai Lunas
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || paymentStatus === "PENDING" || status === "completed"}
                onClick={() => run(() => updatePaymentStatus(orderId, "PENDING"))}
              >
                Belum Dibayar
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || paymentStatus === "FAILED" || status === "completed"}
                onClick={() => run(() => updatePaymentStatus(orderId, "FAILED"))}
              >
                Gagal
              </Button>
            </div>
          </div>
        )}

        {!finished && (
          <div className="grid gap-2">
            <p className="text-sm font-medium">Status pesanan</p>
            <div className="flex flex-wrap gap-2">
              {status === "pending" && (
                <Button size="sm" disabled={pending} onClick={() => run(() => updateOrderStatus(orderId, "processing"))}>
                  Proses Pesanan
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => updateOrderStatus(orderId, "completed"))}
              >
                Tandai Selesai
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Batalkan pesanan ini? Stok akan dikembalikan.")) {
                    run(() => updateOrderStatus(orderId, "canceled"));
                  }
                }}
              >
                Batalkan
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pesanan tunai otomatis ditandai lunas saat diselesaikan. Pesanan non-tunai harus dikonfirmasi lunas terlebih dahulu.
            </p>
          </div>
        )}

        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircleIcon className="size-4 animate-spin" /> Menyimpan...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
