import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types";

/** Pengguna yang sedang login beserta role-nya (di-cache per request). */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  return (profile as AppUser | null) ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/menu");
  return user;
}

export function homePathFor(user: Pick<AppUser, "role">) {
  return user.role === "ADMIN" ? "/admin" : "/menu";
}
