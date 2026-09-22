"use client";

import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border">
      <Button variant="ghost" size="icon-sm" aria-label="Kurangi" onClick={() => onChange(value - 1)}>
        <MinusIcon />
      </Button>
      <span className="w-8 text-center text-sm font-medium tabular-nums">{value}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Tambah"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
