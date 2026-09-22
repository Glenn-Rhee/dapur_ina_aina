"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowDownToLineIcon, ArrowUpFromLineIcon, PackagePlusIcon } from "lucide-react";
import { toast } from "sonner";

import { adjustStock } from "@/actions/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SubmitButton } from "@/components/ui/submit-button";

function StockAdjustForm({
  productId,
  current,
  onDone,
}: {
  productId: string;
  current: number;
  onDone: () => void;
}) {
  const [state, action] = useActionState(adjustStock, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={action} className="grid gap-5" noValidate>
      <input type="hidden" name="product_id" value={productId} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <RadioGroup name="action" defaultValue="add" className="grid-cols-2">
        <Label
          htmlFor="act-add"
          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-secondary has-[[data-state=checked]]:bg-secondary/10"
        >
          <RadioGroupItem id="act-add" value="add" />
          <span className="flex items-center gap-1.5">
            <ArrowDownToLineIcon className="size-4 text-secondary" /> Stok masuk
          </span>
        </Label>
        <Label
          htmlFor="act-reduce"
          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-destructive has-[[data-state=checked]]:bg-destructive/10"
        >
          <RadioGroupItem id="act-reduce" value="reduce" />
          <span className="flex items-center gap-1.5">
            <ArrowUpFromLineIcon className="size-4 text-destructive" /> Stok keluar
          </span>
        </Label>
      </RadioGroup>

      <FormField
        label="Jumlah"
        htmlFor="quantity"
        error={state?.fieldErrors?.quantity}
        hint={`Stok saat ini: ${current}`}
      >
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          placeholder="Contoh: 10"
          aria-invalid={Boolean(state?.fieldErrors?.quantity)}
          required
          autoFocus
        />
      </FormField>

      <SubmitButton pendingText="Menyimpan...">Simpan Perubahan</SubmitButton>
    </form>
  );
}

export function StockAdjustDialog({
  product,
}: {
  product: { id: string; name: string; quantity: number };
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PackagePlusIcon /> Ubah stok
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah stok</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>
        <StockAdjustForm
          productId={product.id}
          current={product.quantity}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
