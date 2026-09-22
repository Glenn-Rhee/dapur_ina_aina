import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

/** Halaman yang wajib login (sesuai use case: semua fitur <<include>> Login). */
const PROTECTED_PREFIXES = ["/menu", "/cart", "/checkout", "/orders", "/admin"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Menyegarkan sesi Supabase di setiap request dan mengarahkan pengunjung
 * yang belum login dari halaman terlindungi ke /login.
 * (Pengecekan role admin dilakukan di app/admin/layout.tsx.)
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Jangan menaruh kode lain di antara createServerClient dan getClaims().
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!isLoggedIn && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;

    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
