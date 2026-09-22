"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3Icon,
  BoxesIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  MenuIcon,
  TagsIcon,
  UtensilsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/menu", label: "Kelola Menu", icon: UtensilsIcon },
  { href: "/admin/kategori", label: "Kategori", icon: TagsIcon },
  { href: "/admin/stok", label: "Kelola Stok", icon: BoxesIcon },
  { href: "/admin/transaksi", label: "Transaksi", icon: ClipboardListIcon },
  { href: "/admin/laporan", label: "Laporan Penjualan", icon: BarChart3Icon },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r bg-sidebar p-4 lg:flex">
        <Logo href="/admin" className="px-2 pt-1" />
        <div className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Panel Admin
        </div>
        <div className="-mt-4 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-4">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Navigasi admin</SheetTitle>
                <SheetDescription className="sr-only">Menu navigasi panel admin</SheetDescription>
                <Logo href="/admin" className="pt-1" />
              </SheetHeader>
              <NavLinks onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Logo href="/admin" className="lg:hidden" showText={false} />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu user={user} variant="admin" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
