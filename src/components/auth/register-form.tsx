"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { register } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(register, null);

  if (state?.ok) {
    return (
      <div className="w-full max-w-sm">
        <Alert variant="success">
          <CircleCheckIcon />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/login">Ke halaman masuk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Buat akun baru</h1>
        <p className="mt-2 text-muted-foreground">Daftar untuk mulai memesan makanan favorit Anda.</p>
      </div>

      <form action={formAction} className="grid gap-5" noValidate>
        {state?.error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <FormField label="Nama lengkap" htmlFor="name" error={state?.fieldErrors?.name}>
          <Input
            id="name"
            name="name"
            placeholder="Nama Anda"
            autoComplete="name"
            maxLength={50}
            aria-invalid={Boolean(state?.fieldErrors?.name)}
            required
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            maxLength={50}
            aria-invalid={Boolean(state?.fieldErrors?.email)}
            required
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={state?.fieldErrors?.password}
          hint="Minimal 8 karakter."
        >
          <PasswordInput
            id="password"
            name="password"
            placeholder="Buat password"
            autoComplete="new-password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            required
          />
        </FormField>

        <FormField
          label="Konfirmasi password"
          htmlFor="confirmPassword"
          error={state?.fieldErrors?.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Ulangi password"
            autoComplete="new-password"
            aria-invalid={Boolean(state?.fieldErrors?.confirmPassword)}
            required
          />
        </FormField>

        <SubmitButton size="lg" pendingText="Mendaftarkan...">
          Daftar
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
