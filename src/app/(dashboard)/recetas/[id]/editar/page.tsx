import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import {
  requerirPermiso,
  tienePermiso,
} from "@/servicios/autenticacion/requerir-permiso";
import { consultarRecetaRepositorio } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { obtenerContextoRecetaAccion } from "@/modulos/recetas/acciones/recetas.acciones";
import { FormularioReceta } from "@/modulos/recetas/componentes/formulario-receta";
import type { EntradaReceta } from "@/modulos/recetas/validaciones/receta.schema";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const usuario = await requerirPermiso("receta.editar");
  const { id } = await params;
  const receta = await consultarRecetaRepositorio(usuario.id, id);
  if (!receta) notFound();

  const puedeEditar = tienePermiso(
    await requerirPermiso("receta.ver"),
    "receta.editar",
  );
  if (receta.estado !== "BORRADOR" || !puedeEditar) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo={`Editar receta ${receta.numeroReceta}`} />
        <EstadoVacio
          icono={Pencil}
          titulo="No editable"
          descripcion="Solo se pueden editar las recetas en borrador."
          accion={
            <Link href={`/recetas/${id}`} className="text-sm underline">
              Ver receta
            </Link>
          }
        />
      </div>
    );
  }

  const contextoRespuesta = await obtenerContextoRecetaAccion(
    receta.trabajadorId,
    receta.registroDiarioId ?? undefined,
    receta.evaluacionId ?? undefined,
    receta.fichaOcupacionalId ?? undefined,
    receta.documentoClinicoId ?? undefined,
  );
  if (!contextoRespuesta.exito || !contextoRespuesta.datos) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo={`Editar receta ${receta.numeroReceta}`} />
        <EstadoVacio
          icono={Pencil}
          titulo="No disponible"
          descripcion={contextoRespuesta.mensaje}
        />
      </div>
    );
  }

  const valoresIniciales: EntradaReceta = {
    trabajadorId: receta.trabajadorId,
    registroDiarioId: receta.registroDiarioId ?? "",
    evaluacionId: receta.evaluacionId ?? "",
    fichaOcupacionalId: receta.fichaOcupacionalId ?? "",
    documentoClinicoId: receta.documentoClinicoId ?? "",
    profesionalId: receta.profesionalId,
    fechaEmision: receta.fechaEmision.toISOString().slice(0, 10),
    indicacionesGenerales: receta.indicacionesGenerales ?? "",
    recomendaciones: receta.recomendaciones ?? "",
    observaciones: receta.observaciones ?? "",
    medicamentos: receta.medicamentos.map((m, i) => ({
      id: m.id,
      medicamentoId: m.medicamentoId ?? undefined,
      nombreMedicamentoHistorico: m.nombreMedicamentoHistorico,
      nombreGenericoHistorico: m.nombreGenericoHistorico ?? "",
      nombreComercialHistorico: m.nombreComercialHistorico ?? "",
      presentacionHistorica: m.presentacionHistorica,
      concentracionHistorica: m.concentracionHistorica ?? "",
      cantidad: m.cantidad,
      dosis: m.dosis,
      frecuencia: m.frecuencia,
      intervaloHoras: m.intervaloHoras ?? null,
      duracion: m.duracion,
      viaAdministracion: m.viaAdministracion,
      indicaciones: m.indicaciones ?? "",
      observaciones: m.observaciones ?? "",
      orden: m.orden ?? i,
    })),
  };

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo={`Editar receta ${receta.numeroReceta}`}
        descripcion={`${receta.trabajadorNombreHistorico} · ${receta.empresaNombreHistorico}`}
      />
      <FormularioReceta
        contexto={contextoRespuesta.datos}
        valoresIniciales={valoresIniciales}
        recetaId={id}
        estado={receta.estado}
        permitirEdicion
      />
    </div>
  );
}
