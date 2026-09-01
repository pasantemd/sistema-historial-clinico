import Link from "next/link";
import { Pill } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { SelectorTrabajadorClinico } from "@/componentes/formularios/selector-trabajador-clinico";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { obtenerContextoRecetaAccion } from "@/modulos/recetas/acciones/recetas.acciones";
import { FormularioReceta } from "@/modulos/recetas/componentes/formulario-receta";
import { construirBorradorReceta } from "@/modulos/recetas/servicios/construir-borrador-receta";
import { cn } from "@/utilidades/clases";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("receta.crear");
  const parametros = await searchParams;
  const texto = (clave: string) => {
    const valor = parametros[clave];
    return typeof valor === "string" ? valor : undefined;
  };
  const trabajadorId = texto("trabajadorId");
  const registroDiarioId = texto("registroDiarioId");
  const evaluacionId = texto("evaluacionId");
  const fichaOcupacionalId = texto("fichaOcupacionalId");
  const documentoClinicoId = texto("documentoClinicoId");

  if (!trabajadorId) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo="Nueva receta" descripcion="Seleccione un trabajador para crear la receta." />
        <SelectorTrabajadorClinico destino="/recetas/nueva" />
      </div>
    );
  }

  const contextoRespuesta = await obtenerContextoRecetaAccion(
    trabajadorId,
    registroDiarioId,
    evaluacionId,
    fichaOcupacionalId,
    documentoClinicoId,
  );
  if (!contextoRespuesta.exito || !contextoRespuesta.datos) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo="Nueva receta" />
        <EstadoVacio icono={Pill} titulo="No disponible" descripcion={contextoRespuesta.mensaje} />
      </div>
    );
  }

  const contexto = contextoRespuesta.datos;
  if (contexto.evaluacion?.recetaId) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo="Nueva receta" />
        <EstadoVacio
          icono={Pill}
          titulo="Receta existente"
          descripcion="Esta evaluación médica ya tiene una receta asociada."
          accion={
            <Link
              href={`/recetas/${contexto.evaluacion.recetaId}`}
              className={cn(buttonVariants())}
            >
              Ver receta
            </Link>
          }
        />
      </div>
    );
  }
  if (contexto.registroDiario?.recetaId) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo="Nueva receta" />
        <EstadoVacio
          icono={Pill}
          titulo="Receta existente"
          descripcion="Este Registro Diario ya tiene una receta asociada."
          accion={
            <Link
              href={`/recetas/${contexto.registroDiario.recetaId}`}
              className={cn(buttonVariants())}
            >
              Ver receta
            </Link>
          }
        />
      </div>
    );
  }
  const valoresIniciales = construirBorradorReceta(contexto, usuario.id, {
    registroDiarioId,
    evaluacionId,
    fichaOcupacionalId,
    documentoClinicoId,
  });

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Nueva receta"
        descripcion={`${contexto.trabajador.nombre} · ${contexto.empresa?.nombre ?? "Sin empresa"}`}
      />
      <FormularioReceta
        contexto={contexto}
        valoresIniciales={valoresIniciales}
        estado="BORRADOR"
        permitirEdicion
      />
    </div>
  );
}
