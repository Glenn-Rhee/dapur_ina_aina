import type { Metadata } from "next";

import { SalesReportView } from "@/components/admin/sales-report-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Laporan Penjualan" };

export default function AdminReportPage() {
  return (
    <>
      <PageHeader title="Laporan Penjualan" description="Pantau performa penjualan mingguan, bulanan, dan tahunan." />
      <SalesReportView />
    </>
  );
}
