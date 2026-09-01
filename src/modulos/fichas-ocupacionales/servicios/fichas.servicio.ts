import {
  anularFichaRepositorio,
  crearBorradorFicha,
  finalizarFichaRepositorio,
  guardarBorradorFicha,
} from "@/modulos/fichas-ocupacionales/repositorios/fichas.repositorio";
import {
  borradorFichaSchema,
  finalizacionFichaSchema,
  type DatosFicha,
} from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";
import { obtenerAgenteUsuarioSolicitud, registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

async function auditar(usuarioId: string, accion: Parameters<typeof registrarAuditoriaSegura>[0]["accion"], entidadId: string, datosNuevos?: Record<string, string | boolean | null>) {
  await registrarAuditoriaSegura({
    usuarioId,
    accion,
    modulo: "FICHAS_OCUPACIONALES",
    entidad: "FICHA_OCUPACIONAL",
    entidadId,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos,
  });
}

export async function crearBorradorFichaServicio(entrada: unknown, usuarioId: string): Promise<{ id: string }> {
  const datos = borradorFichaSchema.parse(entrada) as DatosFicha;
  const id = await crearBorradorFicha(datos, usuarioId);
  await auditar(usuarioId, "FICHA_CREADA", id, { tipoEvaluacion: datos.tipoEvaluacion, empresaId: datos.empresaId, departamentoId: datos.departamentoId });
  return { id };
}

export async function guardarBorradorFichaServicio(id: string, entrada: unknown, usuarioId: string): Promise<{ id: string }> {
  const datos = borradorFichaSchema.parse(entrada) as DatosFicha;
  await guardarBorradorFicha(id, datos, usuarioId);
  await auditar(usuarioId, "FICHA_BORRADOR_GUARDADO", id, { tipoEvaluacion: datos.tipoEvaluacion });
  return { id };
}

export async function finalizarFichaServicio(id: string | null, entrada: unknown, usuarioId: string): Promise<{ id: string }> {
  const datos = finalizacionFichaSchema.parse(entrada) as DatosFicha;
  const fichaId = await finalizarFichaRepositorio(id, datos, usuarioId);
  await auditar(usuarioId, "FICHA_FINALIZADA", fichaId, { tipoEvaluacion: datos.tipoEvaluacion, aptitudMedica: (datos.aptitudMedica ?? null) as string | null });
  return { id: fichaId };
}

export async function anularFichaServicio(id: string, usuarioId: string): Promise<{ id: string }> {
  await anularFichaRepositorio(id, usuarioId);
  await auditar(usuarioId, "FICHA_ANULADA", id);
  return { id };
}
