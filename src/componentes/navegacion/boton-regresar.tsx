"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/componentes/ui/button";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";

interface Props {
  etiqueta?: string;
  rutaRespaldo: string;
  rutaDirecta?: string;
  className?: string;
}

export function BotonRegresar({
  etiqueta = "Regresar",
  rutaRespaldo,
  rutaDirecta,
  className,
}: Props) {
  const router = useRouter();

  if (rutaDirecta) {
    return (
      <Link
        href={rutaDirecta}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5", className)}
        aria-label={etiqueta}
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        {etiqueta}
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Regresar a la página anterior"
      onClick={() => {
        try {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push(rutaRespaldo);
          }
        } catch {
          router.push(rutaRespaldo);
        }
      }}
      className={cn("gap-1.5", className)}
    >
      <ArrowLeft className="size-4 shrink-0" aria-hidden />
      {etiqueta}
    </Button>
  );
}
