import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { ListaEvaluaciones } from "@/modulos/evaluaciones-medicas/componentes/lista-evaluaciones";
import { AlertaAlergias } from "@/modulos/evaluaciones-medicas/componentes/alerta-alergias";
import {
  consultarContextoEvaluacion,
  listarEvaluaciones,
} from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import { cn } from "@/utilidades/clases";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const u = await requerirPermiso("evaluacion-medica.ver");
  const { id } = await params;
  const [contexto, items] = await Promise.all([
    consultarContextoEvaluacion(u.id, id),
    listarEvaluaciones(u.id, id),
  ]);
  if (!contexto) notFound();
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Evaluaciones médicas"
        descripcion={contexto.trabajador.nombre}
        acciones={
          tienePermiso(u, "evaluacion-medica.crear") ? (
            <Link
              className={cn(buttonVariants())}
              href={`/trabajadores/${id}/evaluaciones-medicas/nueva`}
            >
              <Plus aria-hidden /> Nueva evaluación
            </Link>
          ) : undefined
        }
      />
      <AlertaAlergias alergias={contexto.alergias} />
      <ListaEvaluaciones items={items} />
    </div>
  );
}
