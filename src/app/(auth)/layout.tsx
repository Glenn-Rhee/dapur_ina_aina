import { redirect } from "next/navigation";
import { CheckCircle2Icon } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentUser, homePathFor } from "@/lib/auth";

const HIGHLIGHTS = [
  "Pesan makanan, menu tambahan, dan minuman dalam satu keranjang",
  "Bayar tunai atau non-tunai dengan mudah",
  "Pantau status pesanan dan lihat riwayat kapan saja",
];

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-secondary/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-chart-3/40 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground text-primary">
            <CheckCircle2Icon className="size-5" />
          </span>
          <span className="font-heading text-lg font-semibold">Dapur Ina Aina</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-heading text-4xl leading-tight font-semibold">
            Masakan rumahan, langsung ke meja Anda.
          </h2>
          <ul className="mt-8 grid gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-primary-foreground/90">
                <CheckCircle2Icon className="mt-0.5 size-5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/70">
          &copy; {new Date().getFullYear()} Toko Dapur Ina Aina
        </p>
      </aside>

      <main className="relative flex flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-6 pb-16">{children}</div>
      </main>
    </div>
  );
}
