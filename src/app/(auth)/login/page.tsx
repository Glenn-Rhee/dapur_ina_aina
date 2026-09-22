import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/format";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const raw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  return <LoginForm next={safeNextPath(raw) ?? undefined} />;
}
