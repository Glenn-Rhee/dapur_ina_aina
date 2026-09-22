import type { OrderStatus, PaymentMethod, PaymentStatus, Product, StockRow } from "@/types";

const TZ = "Asia/Jakarta";

export function formatRupiah(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

/** Tanggal hari ini (zona Asia/Jakarta) dalam format YYYY-MM-DD. */
export function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Tanggal N hari sebelum hari ini (zona Asia/Jakarta), format YYYY-MM-DD. */
export function daysAgoJakarta(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Ubah tanggal (YYYY-MM-DD) menjadi awal/akhir hari WIB dalam ISO (untuk filter timestamptz). */
export function jakartaDayStart(date: string) {
  return `${date}T00:00:00+07:00`;
}
export function jakartaDayEnd(date: string) {
  return `${date}T23:59:59+07:00`;
}

/** Validasi sederhana format YYYY-MM-DD. */
export function isValidDateStr(value: string | undefined | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)));
}

/** Kode pesanan yang mudah dibaca, contoh: DIA-1A2B3C4D */
export function orderCode(id: string) {
  return `DIA-${id.slice(0, 8).toUpperCase()}`;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu",
  processing: "Diproses",
  completed: "Selesai",
  canceled: "Dibatalkan",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Belum dibayar",
  PAID: "Lunas",
  FAILED: "Gagal",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  CASHLESS: "Non-tunai",
};

/** PostgREST mengembalikan relasi 1:1 sebagai objek, tetapi jaga-jaga jika berupa array. */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function stockOf(product: Pick<Product, "stocks">) {
  return one<StockRow>(product.stocks)?.quantity ?? 0;
}

/** Hanya izinkan path internal untuk parameter ?next= agar tidak jadi open-redirect. */
export function safeNextPath(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
