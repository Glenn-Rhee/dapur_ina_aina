"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending && <LoaderCircleIcon className="animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
