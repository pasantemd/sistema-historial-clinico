"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utilidades/clases";

interface Props {
  resumen: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AcordeonItem({
  resumen,
  defaultOpen = false,
  children,
  className,
}: Props) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger
        className={cn(
          "group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left text-sm font-medium shadow-xs transition-[background-color,border-color] hover:border-primary/25 hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-expanded:rounded-b-none aria-expanded:border-primary/25 aria-expanded:bg-primary/[0.035]",
          className,
        )}
      >
        <div className="flex-1">{resumen}</div>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-primary transition-transform duration-200 group-aria-expanded:rotate-180"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel className="overflow-hidden transition-[height,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <div className="rounded-b-xl border-x border-b bg-card p-4">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
