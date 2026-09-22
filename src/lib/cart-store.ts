/**
 * Keranjang belanja sederhana yang disimpan di localStorage dan dibaca lewat
 * useSyncExternalStore (aman untuk SSR / hydration).
 * Harga di sini hanya untuk tampilan; harga & stok final selalu dihitung ulang
 * di database saat membuat pesanan (function create_order).
 */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  /** Stok tersedia saat terakhir disinkronkan. */
  maxStock: number;
}

const STORAGE_KEY = "dapur-ina-aina:cart:v1";
const EMPTY: CartItem[] = [];

let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getCartSnapshot(): CartItem[] {
  if (cache === null) cache = read();
  return cache;
}

export function getCartServerSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setCart(items: CartItem[]) {
  cache = items.length === 0 ? EMPTY : items;
  try {
    if (items.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage penuh / diblokir: keranjang tetap berfungsi selama sesi berjalan.
  }
  emit();
}
