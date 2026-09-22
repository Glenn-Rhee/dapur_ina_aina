import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
