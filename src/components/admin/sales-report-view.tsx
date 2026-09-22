"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3Icon } from "lucide-react";

import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SalesReport } from "@/types";

const PERIODS: { key: SalesReport["period"]; label: string }[] = [
  { key: "weekly", label: "Mingguan" },
  { key: "monthly", label: "Bulanan" },
  { key: "yearly", label: "Tahunan" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function bucketLabel(bucket: string, period: SalesReport["period"]) {
  if (period === "yearly") {
    const [, m] = bucket.split("-");
    return MONTHS[Number(m) - 1] ?? bucket;
  }
  const d = new Date(`${bucket}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(d);
}

export function SalesReportView() {
  const [period, setPeriod] = useState<SalesReport["period"]>("weekly");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_sales_report", { p_period: period, p_date: null });
      if (!error && data) setReport(data as SalesReport);
    });
  }, [period]);

  const chartData = report?.series.map((s) => ({ ...s, label: bucketLabel(s.bucket, report.period) })) ?? [];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={period === p.key ? "default" : "outline"}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {pending || !report ? (
        <div className="grid gap-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Total pesanan terbayar</p>
                <p className="font-heading text-2xl font-semibold">{report.total_orders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-muted-foreground">Total pendapatan</p>
                <p className="font-heading text-2xl font-semibold text-primary">{formatRupiah(report.total_revenue)}</p>
              </CardContent>
            </Card>
          </div>

          <p className="-mt-2 text-xs text-muted-foreground">
            Periode {formatDate(report.start_date)} &ndash; {formatDate(report.end_date)}
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Grafik pendapatan</CardTitle>
            </CardHeader>
            <CardContent>
              {report.total_orders === 0 ? (
                <EmptyState
                  icon={<BarChart3Icon />}
                  title="Belum ada penjualan"
                  description="Belum ada pesanan lunas pada periode ini."
                  className="border-none py-8"
                />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 4, right: 8 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="var(--muted-foreground)"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="var(--muted-foreground)"
                        width={72}
                        tickFormatter={(v) => formatRupiah(v)}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--accent)" }}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--popover-foreground)",
                          fontSize: 13,
                        }}
                        formatter={(value) => [formatRupiah(Number(value ?? 0)), "Pendapatan"]}
                      />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              {report.top_products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              ) : (
                <ul className="grid gap-3">
                  {report.top_products.map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                            i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="text-muted-foreground">{p.quantity} terjual</span>
                        <span className="w-28 text-right font-medium">{formatRupiah(p.revenue)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
