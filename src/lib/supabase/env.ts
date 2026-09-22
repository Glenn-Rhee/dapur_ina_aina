/**
 * Konfigurasi Supabase dari environment variable (.env.local).
 * NEXT_PUBLIC_* harus diakses secara statis agar ikut ter-bundle oleh Next.js.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export function getSupabaseEnv() {
  if (!url || !key) {
    throw new Error(
      "Konfigurasi Supabase belum diisi. Salin .env.example menjadi .env.local lalu isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, kemudian restart `npm run dev`.",
    );
  }
  return { url, key };
}
