"use client";
import { useState, useTransition } from "react";
import { LoaderCircleIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import type { SimpleResult } from "@/actions/orders";
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
import { deleteCategory, deleteProduct } from "@/actions/admin";

export function ConfirmDeleteButton({
  title,
  description,
  label = "Hapus",
  id,
  usedFor,
}: {
  title: string;
  description: string;
  label?: string;
  id: string;
  usedFor: "product" | "category";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      let res;
      if (usedFor === "product") {
        res = await deleteProduct(id);
      } else {
        res = await deleteCategory(id);
      }
      if (res.ok) {
        toast.success(res.message ?? "Berhasil.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <Button variant="destructive" onClick={run} disabled={pending}>
            {pending && <LoaderCircleIcon className="animate-spin" />}
            {label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
