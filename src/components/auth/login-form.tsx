"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleAlertIcon } from "lucide-react";

import { login } from "@/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(login, null);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Selamat datang kembali</h1>
        <p className="mt-2 text-muted-foreground">Masuk untuk memesan atau mengelola toko.</p>
      </div>

      <form action={formAction} className="grid gap-5" noValidate>
        {next && <input type="hidden" name="next" value={next} />}

        {state?.error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <FormField label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="nama@email.com"
            autoComplete="email"
            aria-invalid={Boolean(state?.fieldErrors?.email)}
            required
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={state?.fieldErrors?.password}>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Masukkan password"
            autoComplete="current-password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            required
          />
        </FormField>

        <SubmitButton size="lg" pendingText="Memproses...">
          Masuk
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
