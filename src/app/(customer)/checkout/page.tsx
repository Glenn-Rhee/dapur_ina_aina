import type { Metadata } from "next";

import { CheckoutView } from "@/components/cart/checkout-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Pembayaran" };

export default function CheckoutPage() {
  return (
    <>
      <PageHeader title="Pembayaran" description="Pilih metode pembayaran lalu selesaikan pesanan." />
      <CheckoutView />
    </>
  );
}
