import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Keranjang" };

export default function CartPage() {
  return (
    <>
      <PageHeader title="Keranjang" description="Periksa kembali pesanan Anda sebelum membayar." />
      <CartView />
    </>
  );
}
