import { SiteHeader } from "@/components/layout/site-header";
import { requireUser } from "@/lib/auth";

export default async function CustomerLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:py-8 md:pb-10">{children}</main>
    </>
  );
}
