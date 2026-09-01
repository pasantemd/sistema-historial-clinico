import { notFound } from "next/navigation";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  consultarCatalogoFicha,
  consultarTrabajadorParaFicha,
} from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { FormularioFicha } from "@/modulos/fichas-ocupacionales/componentes/formulario-ficha";
import { crearValoresIniciales } from "@/modulos/fichas-ocupacionales/componentes/valores-iniciales";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { consultarRegistroDiario } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { consultarDatosProfesional } from "@/modulos/configuracion-profesional/servicios/profesional.servicio";
export default async function PaginaNuevaFicha({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ registroDiarioId?: string | string[] }>;
}) {
  const usuario = await requerirPermiso(PERMISOS_FICHA.crear);
  const { id: trabajadorId } = await params;
  const parametro = (await searchParams).registroDiarioId;
  const registroId = typeof parametro === "string" ? parametro : "";
  const [catalogo, trabajador, registro, perfilProfesional] = await Promise.all([
    consultarCatalogoFicha(usuario.id),
    consultarTrabajadorParaFicha(usuario.id, trabajadorId),
    registroId ? consultarRegistroDiario(usuario.id, registroId) : null,
    consultarDatosProfesional(usuario.id),
  ]);
  if (
    !trabajador ||
    (registroId && (!registro || registro.trabajadorId !== trabajadorId))
  )
    notFound();
  const nombreUsuario = `${usuario.nombres} ${usuario.apellidos}`.trim();
  const base = crearValoresIniciales(trabajador, catalogo, {
    nombreCompleto: perfilProfesional?.nombreCompleto.trim() || nombreUsuario,
    codigoProfesional: perfilProfesional?.codigoProfesional ?? "",
  });
  const valores = {
    ...base,
    registroDiarioId: registroId,
    empresaId: registro?.empresaId ?? base.empresaId,
    departamentoId: registro?.departamentoId ?? base.departamentoId,
    fechaAtencion: registro?.fechaAtencion ?? base.fechaAtencion,
    descripcionProblemaActual:
      registro?.atencionMorbilidad ?? base.descripcionProblemaActual,
    profesionalNombres: registro?.profesional ?? base.profesionalNombres,
  };
  return (
    <FormularioFicha
      trabajador={trabajador}
      catalogo={catalogo}
      valoresIniciales={valores}
      permitirEdicion
    />
  );
}
