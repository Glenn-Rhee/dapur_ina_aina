"use client";

import { useState, useTransition } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { cancelOrder } from "@/actions/orders";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await cancelOrder(orderId);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          Batalkan Pesanan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Batalkan pesanan ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Pesanan akan dibatalkan dan stok menu dikembalikan. Tindakan ini tidak dapat diurungkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Kembali</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <LoaderCircleIcon className="animate-spin" />}
            Ya, batalkan
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
