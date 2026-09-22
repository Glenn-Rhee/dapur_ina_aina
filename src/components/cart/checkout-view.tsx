"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BanknoteIcon, LoaderCircleIcon, QrCodeIcon, ShoppingBasketIcon } from "lucide-react";
import { toast } from "sonner";

import { placeOrder } from "@/actions/orders";
import { EmptyState } from "@/components/layout/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartSync } from "@/hooks/use-cart-sync";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const METHODS: { value: PaymentMethod; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "CASH",
    title: "Tunai",
    desc: "Bayar langsung di toko saat mengambil pesanan.",
    icon: <BanknoteIcon />,
  },
  {
    value: "CASHLESS",
    title: "Non-tunai",
    desc: "Transfer / QRIS. Pembayaran dikonfirmasi oleh admin toko.",
    icon: <QrCodeIcon />,
  },
];

export function CheckoutView() {
  const router = useRouter();
  const { items, totals, syncing, clear } = useCartSync();
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(
        items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        method,
      );
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      clear();
      toast.success("Pesanan berhasil dibuat");
      router.push(`/orders/${result.orderId}?baru=1`);
    });
  }

  if (syncing) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBasketIcon />}
        title="Tidak ada yang perlu dibayar"
        description="Keranjang Anda kosong. Pilih menu terlebih dahulu."
        action={
          <Button asChild>
            <Link href="/menu">Lihat Menu</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Metode pembayaran</CardTitle>
            <CardDescription>Pilih cara Anda membayar pesanan ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              {METHODS.map((m) => (
                <Label
                  key={m.value}
                  htmlFor={`pay-${m.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors",
                    method === m.value ? "border-primary bg-primary/5" : "hover:bg-accent/50",
                  )}
                >
                  <RadioGroupItem id={`pay-${m.value}`} value={m.value} className="mt-1" />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-5">
                    {m.icon}
                  </span>
                  <span className="grid gap-1">
                    <span className="font-heading font-semibold">{m.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">{m.desc}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pesanan Anda</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {items.map((i) => (
              <div key={i.id} className="flex items-start justify-between gap-4 text-sm">
                <span>
                  {i.name} <span className="text-muted-foreground">&times; {i.quantity}</span>
                </span>
                <span className="font-medium">{formatRupiah(i.price * i.quantity)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Total pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Jumlah item</span>
            <span>{totals.count}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="font-heading text-xl font-semibold text-primary">{formatRupiah(totals.price)}</span>
          </div>
          <Button size="lg" className="mt-2" onClick={submit} disabled={pending}>
            {pending && <LoaderCircleIcon className="animate-spin" />}
            {pending ? "Memproses..." : "Buat Pesanan"}
          </Button>
          <Button asChild variant="ghost" disabled={pending}>
            <Link href="/cart">Kembali ke keranjang</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
