"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LayoutDashboardIcon, LogOutIcon, ReceiptTextIcon, StoreIcon } from "lucide-react";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user, variant = "customer" }: { user: AppUser; variant?: "customer" | "admin" }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 rounded-full px-1.5 sm:pr-3" aria-label="Menu akun">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {initials(user.name) || "U"}
          </span>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{user.name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "ADMIN" && variant === "customer" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <LayoutDashboardIcon /> Dashboard Admin
            </Link>
          </DropdownMenuItem>
        )}
        {variant === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/menu">
              <StoreIcon /> Lihat Halaman Toko
            </Link>
          </DropdownMenuItem>
        )}
        {variant === "customer" && (
          <DropdownMenuItem asChild>
            <Link href="/orders">
              <ReceiptTextIcon /> Pesanan Saya
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => logout());
          }}
        >
          <LogOutIcon /> {pending ? "Keluar..." : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
