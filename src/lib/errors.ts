type DbError = { code?: string; message: string };

/**
 * Mengubah error database/Supabase menjadi pesan yang aman & ramah ditampilkan.
 * P0001 = RAISE EXCEPTION dari function SQL (pesannya sudah berbahasa Indonesia).
 */
export function dbErrorMessage(
  error: DbError,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string {
  switch (error.code) {
    case "P0001":
    case "28000":
    case "42501":
      return error.message;
    case "23505":
      return "Data dengan nilai tersebut sudah ada.";
    case "42P01":
    case "PGRST202":
    case "PGRST205":
      return "Tabel atau function database belum ada. Pastikan file schema.sql sudah dijalankan di Supabase.";
    default:
      return fallback;
  }
}
