"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlusIcon, LoaderCircleIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { saveProduct } from "@/actions/admin";
import { ProductImage } from "@/components/menu/product-image";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

export interface ProductFormValue {
  id: string;
  id_category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function ProductForm({
  product,
  categories,
  onDone,
}: {
  product?: ProductFormValue;
  categories: Pick<Category, "id" | "name">[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveProduct, null);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onDone();
    }
  }, [state, onDone]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Format gambar harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran gambar maksimal 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, cacheControl: "3600" });
      if (error) throw error;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("Gambar berhasil diunggah.");
    } catch {
      toast.error("Gagal mengunggah gambar. Pastikan bucket 'product-images' sudah dibuat (jalankan schema.sql).");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={action} className="grid gap-5" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <FormField label="Nama menu" htmlFor="p-name" error={state?.fieldErrors?.name}>
        <Input
          id="p-name"
          name="name"
          defaultValue={product?.name}
          maxLength={100}
          placeholder="Contoh: Nasi Ayam Goreng"
          aria-invalid={Boolean(state?.fieldErrors?.name)}
          required
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Kategori" htmlFor="p-cat" error={state?.fieldErrors?.id_category}>
          <Select name="id_category" defaultValue={product?.id_category}>
            <SelectTrigger id="p-cat" className="w-full" aria-invalid={Boolean(state?.fieldErrors?.id_category)}>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Harga (Rp)" htmlFor="p-price" error={state?.fieldErrors?.price}>
          <Input
            id="p-price"
            name="price"
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            defaultValue={product?.price}
            placeholder="15000"
            aria-invalid={Boolean(state?.fieldErrors?.price)}
            required
          />
        </FormField>
      </div>

      <FormField label="Deskripsi (opsional)" htmlFor="p-desc" error={state?.fieldErrors?.description}>
        <Textarea id="p-desc" name="description" defaultValue={product?.description ?? ""} rows={3} />
      </FormField>

      <div className="grid gap-2">
        <Label htmlFor="p-image">Foto menu (opsional)</Label>
        <div className="flex items-start gap-4">
          <div className="w-28 shrink-0 overflow-hidden rounded-lg border">
            <ProductImage src={imageUrl || null} alt="Pratinjau" sizes="112px" />
          </div>
          <div className="grid flex-1 gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <LoaderCircleIcon className="animate-spin" /> : <ImagePlusIcon />}
                {uploading ? "Mengunggah..." : "Unggah gambar"}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                  <XIcon /> Hapus
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Input
              id="p-image"
              name="image_url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              maxLength={255}
              placeholder="atau tempel URL gambar (https://...)"
              aria-invalid={Boolean(state?.fieldErrors?.image_url)}
            />
            {state?.fieldErrors?.image_url && (
              <p className="text-sm text-destructive">{state.fieldErrors.image_url[0]}</p>
            )}
          </div>
        </div>
      </div>

      {!product && (
        <FormField
          label="Stok awal (opsional)"
          htmlFor="p-stock"
          error={state?.fieldErrors?.initial_stock}
          hint="Stok selanjutnya dapat diubah dari halaman Kelola Stok."
        >
          <Input id="p-stock" name="initial_stock" type="number" min={0} step={1} defaultValue={0} />
        </FormField>
      )}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="p-active">Tampilkan di menu</Label>
          <p className="text-xs text-muted-foreground">Menu nonaktif tidak bisa dipesan pelanggan.</p>
        </div>
        <Switch id="p-active" name="is_active" defaultChecked={product?.is_active ?? true} />
      </div>

      <SubmitButton disabled={uploading} pendingText="Menyimpan...">
        Simpan Menu
      </SubmitButton>
    </form>
  );
}

export function ProductFormDialog({
  product,
  categories,
}: {
  product?: ProductFormValue;
  categories: Pick<Category, "id" | "name">[];
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(product);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon-sm" aria-label="Ubah menu">
            <PencilIcon />
          </Button>
        ) : (
          <Button>
            <PlusIcon /> Tambah Menu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Ubah menu" : "Tambah menu"}</DialogTitle>
          <DialogDescription>Data menu akan langsung tampil di halaman pelanggan.</DialogDescription>
        </DialogHeader>
        <ProductForm product={product} categories={categories} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
