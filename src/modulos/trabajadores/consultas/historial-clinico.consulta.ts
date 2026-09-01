import { prisma } from "@/servicios/base-datos/prisma";
import type {
  GrupoHistorialClinicoDto,
  PermisosHistorialClinico,
} from "@/modulos/trabajadores/tipos/historial-clinico";
import {
  agruparDocumentosPorFechaClinica,
  type DocumentoHistorialConFecha,
} from "@/modulos/trabajadores/utilidades/agrupar-historial-clinico";

const iso = (valor: Date | null) => valor?.toISOString().slice(0, 10) ?? null;
const nombreUsuario = (
  usuario: { nombres: string; apellidos: string } | null,
) => (usuario ? `${usuario.apellidos} ${usuario.nombres}` : null);

export async function consultarHistorialClinicoTrabajador(
  usuarioId: string,
  trabajadorId: string,
  permisos: PermisosHistorialClinico,
): Promise<GrupoHistorialClinicoDto[]> {
  const puedeVerInformacionClinica = Object.values(permisos).some(Boolean);
  const [
    atencionesLegadas,
    registros,
    evaluaciones,
    fichas,
    recetas,
    documentos,
  ] = await Promise.all([
    puedeVerInformacionClinica
      ? prisma.atencionMedica.findMany({
          where: {
            trabajadorId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          select: {
            id: true,
            fechaAtencion: true,
            estado: true,
            profesionalNombreHistorico: true,
            empresaNombreHistorico: true,
          },
          orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }],
        })
      : [],
    permisos.registroDiario
      ? prisma.registroDiarioAtencion.findMany({
          where: {
            trabajadorId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          orderBy: { diaAtencion: "desc" },
        })
      : [],
    permisos.evaluaciones
      ? prisma.evaluacionMedica.findMany({
          where: {
            trabajadorId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }],
        })
      : [],
    permisos.fichas
      ? prisma.fichaOcupacional.findMany({
          where: {
            trabajadorId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          select: {
            id: true,
            numeroFicha: true,
            fechaAtencion: true,
            tipoEvaluacion: true,
            estado: true,
            empresaNombreHistorico: true,
            profesionalNombres: true,
            usuario: { select: { nombres: true, apellidos: true } },
          },
          orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }],
        })
      : [],
    permisos.recetas
      ? prisma.recetaMedica.findMany({
          where: {
            trabajadorId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          orderBy: [{ fechaEmision: "desc" }, { creadoEn: "desc" }],
        })
      : [],
    permisos.documentos
      ? prisma.documentoClinico.findMany({
          where: {
            trabajadorId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          orderBy: [{ fechaDocumento: "desc" }, { creadoEn: "desc" }],
        })
      : [],
  ]);

  const items: DocumentoHistorialConFecha[] = [
    ...atencionesLegadas.map((item) => ({
      id: item.id,
      fecha: iso(item.fechaAtencion),
      tipo: "ATENCION_LEGADA" as const,
      etiqueta: "Atención médica · legado",
      numero: `LEG-${item.id.slice(0, 8).toUpperCase()}`,
      estado: item.estado,
      profesional: item.profesionalNombreHistorico,
      empresa: item.empresaNombreHistorico,
      ruta: `/trabajadores/${trabajadorId}/atenciones/${item.id}`,
    })),
    ...registros.map((item) => ({
      id: item.id,
      fecha: iso(item.diaAtencion),
      tipo: "REGISTRO_DIARIO" as const,
      etiqueta: "Registro diario",
      numero: item.numeroRegistro,
      estado: item.estado,
      profesional: item.profesionalNombreHistorico,
      empresa: item.empresaNombreHistorico,
      ruta: `/registro-diario/${item.id}`,
      rutaPdf: `/api/registro-diario/${item.id}/pdf`,
      rutaExcel: `/api/registro-diario/${item.id}/excel`,
    })),
    ...evaluaciones.map((item) => ({
      id: item.id,
      fecha: iso(item.fechaAtencion),
      tipo: "EVALUACION_MEDICA" as const,
      etiqueta: "Evaluación médica",
      numero: item.numeroEvaluacion ?? "Borrador sin número",
      estado: item.estado,
      profesional: item.profesionalNombreHistorico,
      empresa: item.empresaNombreHistorico,
      ruta: `/evaluaciones-medicas/${item.id}`,
      rutaPdf: `/api/evaluaciones-medicas/${item.id}/pdf`,
    })),
    ...fichas.map((item) => ({
      id: item.id,
      fecha: iso(item.fechaAtencion),
      tipo: "FICHA_OCUPACIONAL" as const,
      etiqueta: `Ficha ocupacional · ${item.tipoEvaluacion}`,
      numero: item.numeroFicha ?? "Borrador sin número",
      estado: item.estado,
      profesional: item.profesionalNombres ?? nombreUsuario(item.usuario),
      empresa: item.empresaNombreHistorico ?? "Sin empresa",
      ruta: `/fichas-ocupacionales/${item.id}`,
    })),
    ...fichas
      .filter((item) => item.estado === "FINALIZADA")
      .map((item) => ({
        id: item.id,
        fecha: iso(item.fechaAtencion),
        tipo: "CERTIFICADO_OCUPACIONAL" as const,
        etiqueta: "Certificado ocupacional",
        numero: `CO-${(item.numeroFicha ?? item.id).replace(/^FO-/, "")}`,
        estado: item.estado,
        profesional: item.profesionalNombres ?? nombreUsuario(item.usuario),
        empresa: item.empresaNombreHistorico ?? "Sin empresa",
        ruta: `/fichas-ocupacionales/${item.id}/certificado`,
        rutaPdf: `/api/fichas/${item.id}/certificado/pdf`,
        rutaExcel: `/api/fichas/${item.id}/exportar/excel`,
      })),
    ...recetas.map((item) => ({
      id: item.id,
      fecha: iso(item.fechaEmision),
      tipo: "RECETA" as const,
      etiqueta: "Receta",
      numero: item.numeroReceta,
      estado: item.estado,
      profesional: item.profesionalNombreHistorico,
      empresa: item.empresaNombreHistorico,
      ruta: `/recetas/${item.id}`,
      rutaPdf: `/api/recetas/${item.id}/pdf`,
    })),
    ...documentos.map((item) => ({
      id: item.id,
      fecha: iso(item.fechaDocumento),
      tipo: "DOCUMENTO_CLINICO" as const,
      etiqueta: "Documento clínico",
      numero: item.numeroDocumento,
      estado: item.estado,
      profesional: item.profesionalNombreHistorico,
      empresa: item.empresaNombreHistorico,
      ruta: `/documentos-clinicos/${item.id}`,
      rutaPdf: `/api/documentos-clinicos/${item.id}/pdf`,
    })),
  ];

  return agruparDocumentosPorFechaClinica(items);
}
