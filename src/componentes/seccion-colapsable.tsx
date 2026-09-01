"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utilidades/clases";

interface Props {
  titulo: string;
  cantidad: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SeccionColapsable({
  titulo,
  cantidad,
  defaultOpen = true,
  children,
  className,
}: Props) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger
        className={cn(
          "group flex min-h-12 w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left text-sm font-semibold shadow-xs transition-[background-color,border-color] hover:border-primary/25 hover:bg-primary/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
      >
        <span>
          {titulo}{" "}
          <span className="text-muted-foreground">({cantidad})</span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-primary transition-transform duration-200 group-aria-expanded:rotate-180"
        />
      </Collapsible.Trigger>
      <Collapsible.Panel className="overflow-hidden transition-[height,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
        <div className="pt-4">{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
