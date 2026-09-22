import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/types";

const ORDER_VARIANT: Record<OrderStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  canceled: "danger",
};

const PAYMENT_VARIANT: Record<PaymentStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANT[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}
