import { Pill } from "lucide-react";

import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { obtenerContextoRecetaAccion } from "@/modulos/recetas/acciones/recetas.acciones";
import { FormularioReceta } from "@/modulos/recetas/componentes/formulario-receta";
import { VIAS_ADMINISTRACION } from "@/modulos/recetas/constantes";
import type { EntradaReceta } from "@/modulos/recetas/validaciones/receta.schema";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function Page({ params, searchParams }: Props) {
  const usuario = await requerirPermiso("receta.crear");
  const { id: trabajadorId } = await params;

  let evaluacionId: string | undefined;
  let registroDiarioId: string | undefined;
  let fichaOcupacionalId: string | undefined;
  let documentoClinicoId: string | undefined;
  if (searchParams) {
    const sp = await searchParams;
    const v = sp.evaluacionId;
    if (typeof v === "string") evaluacionId = v;
    if (typeof sp.registroDiarioId === "string") registroDiarioId = sp.registroDiarioId;
    if (typeof sp.fichaOcupacionalId === "string") fichaOcupacionalId = sp.fichaOcupacionalId;
    if (typeof sp.documentoClinicoId === "string") documentoClinicoId = sp.documentoClinicoId;
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
  const valoresIniciales: EntradaReceta = {
    trabajadorId: contexto.trabajador.id,
    registroDiarioId: contexto.registroDiarioId ?? "",
    evaluacionId: evaluacionId ?? "",
    fichaOcupacionalId: fichaOcupacionalId ?? "",
    documentoClinicoId: documentoClinicoId ?? "",
    profesionalId: contexto.registroDiario?.profesionalId && contexto.profesionales.some((item) => item.id === contexto.registroDiario?.profesionalId) ? contexto.registroDiario.profesionalId : contexto.profesionales.some((item) => item.id === usuario.id) ? usuario.id : "",
    fechaEmision: contexto.registroDiario?.fecha ?? hoyISO(),
    indicacionesGenerales: "",
    recomendaciones: "",
    observaciones: "",
    medicamentos: [
      {
        nombreMedicamentoHistorico: contexto.registroDiario?.medicacion ?? "",
        nombreGenericoHistorico: "",
        nombreComercialHistorico: "",
        presentacionHistorica: "",
        concentracionHistorica: "",
        cantidad: "",
        dosis: "",
        frecuencia: "",
        intervaloHoras: null,
        duracion: "",
        viaAdministracion: VIAS_ADMINISTRACION[0],
        indicaciones: "",
        observaciones: "",
        orden: 0,
      },
    ],
  };

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
