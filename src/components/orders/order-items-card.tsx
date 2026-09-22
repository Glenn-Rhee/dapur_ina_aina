import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/format";
import type { Order } from "@/types";

export function OrderItemsCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rincian pesanan</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {order.order_details.map((d) => (
          <div key={d.id} className="flex items-start justify-between gap-4 text-sm">
            <div>
              <p className="font-medium">{d.products?.name ?? "Menu dihapus"}</p>
              <p className="text-muted-foreground">
                {d.quantity} &times; {formatRupiah(d.price)}
              </p>
            </div>
            <span className="font-medium">{formatRupiah(d.subtotal)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="font-medium">Total</span>
          <span className="font-heading text-lg font-semibold text-primary">
            {formatRupiah(order.total_amount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
