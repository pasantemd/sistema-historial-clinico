import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  tamanoPagina: 10 | 25 | 50;
  parametros: URLSearchParams;
}

function enlacePagina(parametros: URLSearchParams, pagina: number) {
  const nuevos = new URLSearchParams(parametros);
  nuevos.set("pagina", String(pagina));
  return `/trabajadores?${nuevos.toString()}`;
}

export function PaginacionTrabajadores({ pagina, totalPaginas, total, tamanoPagina, parametros }: Props) {
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <p>{total} {total === 1 ? "vínculo laboral" : "vínculos laborales"}</p>
        <span aria-hidden>·</span>
        <span>Mostrar</span>
        {[10, 25, 50].map((tamano) => {
          const nuevos = new URLSearchParams(parametros);
          nuevos.set("tamanoPagina", String(tamano));
          nuevos.delete("pagina");
          return <Link key={tamano} aria-current={tamanoPagina === tamano ? "page" : undefined} className={cn(buttonVariants({ variant: tamanoPagina === tamano ? "secondary" : "ghost", size: "sm" }))} href={`/trabajadores?${nuevos.toString()}`}>{tamano}</Link>;
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link aria-disabled={pagina <= 1} tabIndex={pagina <= 1 ? -1 : undefined} className={cn(buttonVariants({ variant: "outline", size: "sm" }), pagina <= 1 && "pointer-events-none opacity-50")} href={enlacePagina(parametros, Math.max(1, pagina - 1))}><ChevronLeft aria-hidden /> Anterior</Link>
        <span>Página {pagina} de {totalPaginas}</span>
        <Link aria-disabled={pagina >= totalPaginas} tabIndex={pagina >= totalPaginas ? -1 : undefined} className={cn(buttonVariants({ variant: "outline", size: "sm" }), pagina >= totalPaginas && "pointer-events-none opacity-50")} href={enlacePagina(parametros, Math.min(totalPaginas, pagina + 1))}>Siguiente <ChevronRight aria-hidden /></Link>
      </div>
    </div>
  );
}
