import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { SelectorTrabajadorClinico } from "@/componentes/formularios/selector-trabajador-clinico";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/formulario-evaluacion";
import { valoresInicialesEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/valores-iniciales-evaluacion";
import {
  construirContextoEvaluacionDesdeRegistro,
  consultarContextoEvaluacion,
} from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { construirValoresEvaluacionDesdeRegistro } from "@/modulos/evaluaciones-medicas/servicios/construir-valores-evaluacion-desde-registro";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const usuario = await requerirPermiso("evaluacion-medica.crear");
  const p = await searchParams;
  const valor = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : "";
  const registroId = valor(p.registroDiarioId);
  const origenRegistro = registroId
    ? await construirContextoEvaluacionDesdeRegistro(usuario.id, registroId)
    : null;
  if (registroId && !origenRegistro) notFound();
  const trabajadorId = origenRegistro?.registro.trabajadorId ?? valor(p.trabajadorId);
  if (!trabajadorId)
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina
          titulo="Nueva evaluación médica"
          descripcion="Seleccione un trabajador para continuar"
        />
        <SelectorTrabajadorClinico
          destino="/evaluaciones-medicas/nueva"
          parametros={registroId ? `registroDiarioId=${registroId}` : ""}
        />
      </div>
    );
  const contexto = origenRegistro?.contexto ?? await consultarContextoEvaluacion(usuario.id, trabajadorId);
  if (!contexto) notFound();
  const iniciales = valoresInicialesEvaluacion(trabajadorId);
  const valores = origenRegistro
    ? construirValoresEvaluacionDesdeRegistro(iniciales, origenRegistro.registro)
    : { ...iniciales, profesionalResponsable: `${usuario.nombres} ${usuario.apellidos}` };
  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Nueva evaluación médica"
        descripcion={contexto.trabajador.nombre}
      />
      <FormularioEvaluacion contexto={contexto} valores={valores} />
    </div>
  );
}
