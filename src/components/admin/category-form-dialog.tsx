"use client";

import { useActionState, useEffect, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { saveCategory } from "@/actions/admin";
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
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/types";

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const [state, action] = useActionState(saveCategory, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onDone();
    }
  }, [state, onDone]);

  return (
    <form action={action} className="grid gap-5" noValidate>
      {category && <input type="hidden" name="id" value={category.id} />}

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <FormField label="Nama kategori" htmlFor="cat-name" error={state?.fieldErrors?.name}>
        <Input
          id="cat-name"
          name="name"
          defaultValue={category?.name}
          maxLength={100}
          placeholder="Contoh: Makanan"
          aria-invalid={Boolean(state?.fieldErrors?.name)}
          required
        />
      </FormField>

      <FormField label="Deskripsi (opsional)" htmlFor="cat-desc" error={state?.fieldErrors?.description}>
        <Textarea id="cat-desc" name="description" defaultValue={category?.description ?? ""} rows={3} />
      </FormField>

      <SubmitButton pendingText="Menyimpan...">Simpan</SubmitButton>
    </form>
  );
}

export function CategoryFormDialog({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(category);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon-sm" aria-label="Ubah kategori">
            <PencilIcon />
          </Button>
        ) : (
          <Button>
            <PlusIcon /> Tambah Kategori
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah kategori" : "Tambah kategori"}</DialogTitle>
          <DialogDescription>Kategori dipakai untuk mengelompokkan menu.</DialogDescription>
        </DialogHeader>
        <CategoryForm category={category} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
