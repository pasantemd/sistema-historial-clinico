import Link from "next/link";
import { Plus } from "lucide-react";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";

export default function Page() {
  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/atenciones" />
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-muted-foreground">
          Las atenciones se registran desde el módulo de evaluaciones médicas.
        </p>
        <Link href="/evaluaciones-medicas/nueva" className={cn(buttonVariants(), "mt-4")}>
          <Plus aria-hidden /> Ir a nueva evaluación
        </Link>
      </div>
    </div>
  );
}
