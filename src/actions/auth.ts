"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser, homePathFor } from "@/lib/auth";
import { safeNextPath } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { ActionState } from "@/types";

function mapAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau password salah.";
  if (m.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Cek kotak masuk Anda untuk tautan konfirmasi.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Email sudah terdaftar. Silakan masuk.";
  if (m.includes("rate limit")) return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  if (m.includes("password")) return "Password tidak memenuhi persyaratan.";
  return "Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.";
}

/** Activity diagram "Login": validasi data -> cek email -> cek password -> buat token (sesi). */
export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: mapAuthError(error.message) };

  const next = safeNextPath(formData.get("next"));
  const user = await getCurrentUser();
  redirect(next ?? (user ? homePathFor(user) : "/menu"));
}

/** Activity diagram "Registrasi": validasi format -> cek email -> simpan data & buat token. */
export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang Anda masukkan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: mapAuthError(error.message) };

  // Jika email sudah terdaftar & konfirmasi email aktif, Supabase mengembalikan user tanpa identities.
  if (data.user && data.user.identities?.length === 0) {
    return { error: "Email sudah terdaftar. Silakan masuk." };
  }

  if (data.session) {
    redirect("/menu");
  }

  return {
    ok: true,
    message:
      "Pendaftaran berhasil. Kami telah mengirim tautan konfirmasi ke email Anda. Silakan konfirmasi lalu masuk.",
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
