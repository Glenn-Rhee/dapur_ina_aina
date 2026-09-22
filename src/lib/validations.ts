import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Format email tidak valid.").max(50, "Email maksimal 50 karakter."),
  password: z.string().min(1, "Password wajib diisi."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(50, "Nama maksimal 50 karakter."),
    email: z.email("Format email tidak valid.").max(50, "Email maksimal 50 karakter."),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(72, "Password maksimal 72 karakter."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter.").optional(),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama maksimal 100 karakter."),
  id_category: z.string().uuid("Pilih kategori."),
  description: z.string().trim().max(1000, "Deskripsi maksimal 1000 karakter.").optional(),
  price: z.coerce
    .number({ error: "Harga harus berupa angka." })
    .min(0, "Harga tidak boleh negatif.")
    .max(9_999_999_999, "Harga terlalu besar."),
  image_url: z.string().trim().max(255, "URL gambar maksimal 255 karakter.").optional(),
  is_active: z.boolean(),
  initial_stock: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

export const stockAdjustSchema = z.object({
  product_id: z.string().uuid(),
  action: z.enum(["add", "reduce"], { error: "Pilih jenis perubahan stok." }),
  quantity: z.coerce
    .number({ error: "Jumlah harus berupa angka." })
    .int("Jumlah harus bilangan bulat.")
    .min(1, "Jumlah minimal 1.")
    .max(1_000_000, "Jumlah terlalu besar."),
});

export const orderItemsSchema = z
  .array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .min(1, "Keranjang masih kosong.")
  .max(50, "Terlalu banyak item dalam satu pesanan.");
