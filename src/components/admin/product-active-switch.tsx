"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { toggleProductActive } from "@/actions/admin";
import { Switch } from "@/components/ui/switch";

export function ProductActiveSwitch({ id, isActive, name }: { id: string; isActive: boolean; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={pending}
      aria-label={`Aktifkan ${name}`}
      onCheckedChange={(checked) =>
        startTransition(async () => {
          const res = await toggleProductActive(id, checked);
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        })
      }
    />
  );
}
