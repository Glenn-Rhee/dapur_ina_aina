"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReceiptTextIcon, ShoppingCartIcon, UtensilsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

const NAV = [
  { href: "/menu", label: "Menu", icon: UtensilsIcon },
  { href: "/orders", label: "Pesanan", icon: ReceiptTextIcon },
];

export function SiteHeader({ user }: { user: AppUser }) {
  const pathname = usePathname();
  const { totals, ready } = useCart();
  const count = ready ? totals.count : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo href="/menu" />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Keranjang">
            <Link href="/cart">
              <ShoppingCartIcon />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] leading-5 font-semibold text-primary-foreground">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </Button>
          <UserMenu user={user} />
        </div>
      </div>

      {/* Navigasi bawah untuk layar kecil */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t bg-background/95 backdrop-blur md:hidden">
        {[...NAV, { href: "/cart", label: "Keranjang", icon: ShoppingCartIcon }].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
