import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import { obtenerNumeroCorrelativo } from "@/servicios/base-datos/numero-correlativo";
import type { DatosDocumentoClinico } from "@/modulos/documentos-clinicos/validaciones/documento-clinico.schema";
import {
  AlergiaDocumentoRequiereJustificacionError,
  DocumentoClinicoBloqueadoError,
  DocumentoClinicoNoEncontradoError,
} from "@/modulos/documentos-clinicos/errores";
import { coincideAlergiaMedicamento } from "@/modulos/evaluaciones-medicas/utilidades/normalizar-sustancia";

type Tx = Prisma.TransactionClient;
const fecha = (valor: string) => new Date(`${valor}T00:00:00.000Z`);
const texto = (valor?: string) => valor?.trim() || null;

async function maestros(
  tx: Tx,
  trabajadorId: string,
  usuarioId: string,
  datos: DatosDocumentoClinico,
) {
  const [trabajador, profesional] = await Promise.all([
    tx.trabajador.findFirst({
      where: {
        id: trabajadorId,
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      include: {
        empresa: true,
        departamento: true,
        alergias: { where: { activa: true, tipo: "MEDICAMENTO" } },
      },
    }),
    tx.usuario.findFirst({
      where: { id: usuarioId, estado: "ACTIVO" },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoProfesional: true,
      },
    }),
  ]);
  if (!trabajador || trabajador.departamento.empresaId !== trabajador.empresaId)
    throw new Error("El trabajador no tiene una asignación laboral válida.");
  if (!profesional)
    throw new Error("El profesional autenticado no está activo.");
  let origen: {
    empresaId: string;
    departamentoId: string | null;
    empresa: string;
    ruc: string;
    departamento: string | null;
  } | null = null;
  if (datos.registroDiarioId) {
    const registro = await tx.registroDiarioAtencion.findFirst({
        where: {
          id: datos.registroDiarioId,
          trabajadorId,
          estado: { not: "ANULADO" },
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
      select: {
        empresaId: true,
        departamentoId: true,
        empresaNombreHistorico: true,
        empresaRucHistorico: true,
        departamentoNombreHistorico: true,
      },
    });
    if (!registro)
      throw new Error("El registro diario no corresponde al trabajador.");
    origen = {
      empresaId: registro.empresaId,
      departamentoId: registro.departamentoId,
      empresa: registro.empresaNombreHistorico,
      ruc: registro.empresaRucHistorico ?? "",
      departamento: registro.departamentoNombreHistorico,
    };
  }
  if (datos.evaluacionMedicaId) {
    const evaluacion = await tx.evaluacionMedica.findFirst({
        where: {
          id: datos.evaluacionMedicaId,
          trabajadorId,
          estado: { not: "ANULADA" },
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
      select: {
        empresaId: true,
        departamentoId: true,
        empresaNombreHistorico: true,
        empresaRucHistorico: true,
        departamentoNombreHistorico: true,
      },
    });
    if (!evaluacion)
      throw new Error("La evaluación no corresponde al trabajador.");
    origen = {
      empresaId: evaluacion.empresaId,
      departamentoId: evaluacion.departamentoId,
      empresa: evaluacion.empresaNombreHistorico,
      ruc: evaluacion.empresaRucHistorico,
      departamento: evaluacion.departamentoNombreHistorico,
    };
  }
  if (datos.fichaOcupacionalId) {
    const ficha = await tx.fichaOcupacional.findFirst({
        where: {
          id: datos.fichaOcupacionalId,
          trabajadorId,
          estado: { not: "ANULADA" },
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
      select: {
        empresaId: true,
        departamentoId: true,
        empresaNombreHistorico: true,
        empresaRucHistorico: true,
        departamentoNombreHistorico: true,
      },
    });
    if (!ficha)
      throw new Error("La ficha ocupacional no corresponde al trabajador.");
    origen = {
      empresaId: ficha.empresaId,
      departamentoId: ficha.departamentoId,
      empresa: ficha.empresaNombreHistorico ?? trabajador.empresa.razonSocial,
      ruc: ficha.empresaRucHistorico ?? trabajador.empresa.ruc,
      departamento: ficha.departamentoNombreHistorico,
    };
  }
  for (const item of datos.tratamientos) {
    const alergia = trabajador.alergias.find((a) =>
      coincideAlergiaMedicamento(item.nombre, a.sustancia),
    );
    if (
      alergia &&
      (!item.alertaAlergiaConfirmada || !item.justificacionAlergia?.trim())
    )
      throw new AlergiaDocumentoRequiereJustificacionError();
  }
  return { trabajador, profesional, origen };
}

async function reemplazarRelaciones(
  tx: Tx,
  documentoClinicoId: string,
  datos: DatosDocumentoClinico,
) {
  const ids = datos.diagnosticos.map((d) => d.enfermedadId);
  if (new Set(ids).size !== ids.length)
    throw new Error("No repita diagnósticos CIE-10.");
  const enfermedades = ids.length
    ? await tx.enfermedadCie10.findMany({
        where: { id: { in: ids }, activa: true },
        select: { id: true, codigo: true, descripcion: true },
      })
    : [];
  if (enfermedades.length !== ids.length)
    throw new Error("Uno o más diagnósticos CIE-10 no están disponibles.");
  const mapa = new Map(enfermedades.map((e) => [e.id, e]));
  await tx.documentoClinicoDiagnostico.deleteMany({
    where: { documentoClinicoId },
  });
  if (datos.diagnosticos.length)
    await tx.documentoClinicoDiagnostico.createMany({
      data: datos.diagnosticos.map((d, orden) => ({
        documentoClinicoId,
        enfermedadId: d.enfermedadId,
        tipo: d.tipo,
        codigoHistorico: mapa.get(d.enfermedadId)!.codigo,
        descripcionHistorica: mapa.get(d.enfermedadId)!.descripcion,
        observacion: texto(d.observacion),
        orden,
      })),
    });
  await tx.documentoClinicoTratamiento.deleteMany({
    where: { documentoClinicoId },
  });
  if (datos.tratamientos.length)
    await tx.documentoClinicoTratamiento.createMany({
      data: datos.tratamientos.map((t, orden) => ({
        documentoClinicoId,
        nombreHistorico: t.nombre.trim(),
        concentracion: texto(t.concentracion),
        dosis: t.dosis.trim(),
        cantidad: t.cantidad.trim(),
        frecuencia: texto(t.frecuencia),
        intervaloHoras:
          typeof t.intervaloHoras === "number" ? t.intervaloHoras : null,
        duracion: texto(t.duracion),
        via: texto(t.via),
        indicaciones: texto(t.indicaciones),
        observaciones: texto(t.observaciones),
        alertaAlergiaConfirmada: t.alertaAlergiaConfirmada,
        justificacionAlergia: texto(t.justificacionAlergia),
        orden,
      })),
    });
}

function escalares(datos: DatosDocumentoClinico) {
  return {
    fechaDocumento: fecha(datos.fechaDocumento),
    motivoConsulta: texto(datos.motivoConsulta),
    evolucion: texto(datos.evolucion),
    observaciones: texto(datos.observaciones),
    registroDiarioId: datos.registroDiarioId || null,
    evaluacionMedicaId: datos.evaluacionMedicaId || null,
    fichaOcupacionalId: datos.fichaOcupacionalId || null,
  };
}

export async function crearDocumentoClinicoRepositorio(
  datos: DatosDocumentoClinico,
  usuarioId: string,
  finalizar: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const { trabajador, profesional, origen } = await maestros(
      tx,
      datos.trabajadorId,
      usuarioId,
      datos,
    );
    const numeroDocumento = await obtenerNumeroCorrelativo(
      tx,
      "documento-clinico",
    );
    const documento = await tx.documentoClinico.create({
      data: {
        ...escalares(datos),
        numeroDocumento,
        trabajadorId: trabajador.id,
        empresaId: origen ? origen.empresaId : trabajador.empresa.id,
        departamentoId: origen
          ? origen.departamentoId
          : trabajador.departamento.id,
        profesionalId: profesional.id,
        creadoPorId: usuarioId,
        actualizadoPorId: usuarioId,
        trabajadorNombreHistorico: `${trabajador.apellidos} ${trabajador.nombres}`,
        trabajadorDocumentoHistorico: trabajador.numeroDocumento,
        trabajadorNacimientoHistorico: trabajador.fechaNacimiento,
        empresaNombreHistorico: origen
          ? origen.empresa
          : trabajador.empresa.razonSocial,
        empresaRucHistorico: origen ? origen.ruc : trabajador.empresa.ruc,
        departamentoNombreHistorico: origen
          ? origen.departamento
          : trabajador.departamento.nombre,
        profesionalNombreHistorico: `${profesional.nombres} ${profesional.apellidos}`,
        profesionalCodigoHistorico: profesional.codigoProfesional,
        estado: finalizar ? "FINALIZADO" : "BORRADOR",
        finalizadoEn: finalizar ? new Date() : null,
      },
      select: { id: true },
    });
    await reemplazarRelaciones(tx, documento.id, datos);
    return documento;
  });
}

export async function actualizarDocumentoClinicoRepositorio(
  id: string,
  datos: DatosDocumentoClinico,
  usuarioId: string,
  finalizar: boolean,
) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.documentoClinico.findFirst({
      where: {
        id,
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      select: { trabajadorId: true, estado: true },
    });
    if (!existente || existente.trabajadorId !== datos.trabajadorId)
      throw new DocumentoClinicoNoEncontradoError();
    if (existente.estado !== "BORRADOR")
      throw new DocumentoClinicoBloqueadoError();
    const { trabajador, profesional, origen } = await maestros(
      tx,
      datos.trabajadorId,
      usuarioId,
      datos,
    );
    try {
      await tx.documentoClinico.update({
        where: { id, estado: "BORRADOR" },
        data: {
          ...escalares(datos),
          trabajadorId: trabajador.id,
          empresaId: origen ? origen.empresaId : trabajador.empresa.id,
          departamentoId: origen
            ? origen.departamentoId
            : trabajador.departamento.id,
          profesionalId: profesional.id,
          actualizadoPorId: usuarioId,
          trabajadorNombreHistorico: `${trabajador.apellidos} ${trabajador.nombres}`,
          trabajadorDocumentoHistorico: trabajador.numeroDocumento,
          trabajadorNacimientoHistorico: trabajador.fechaNacimiento,
          empresaNombreHistorico: origen
            ? origen.empresa
            : trabajador.empresa.razonSocial,
          empresaRucHistorico: origen ? origen.ruc : trabajador.empresa.ruc,
          departamentoNombreHistorico: origen
            ? origen.departamento
            : trabajador.departamento.nombre,
          profesionalNombreHistorico: `${profesional.nombres} ${profesional.apellidos}`,
          profesionalCodigoHistorico: profesional.codigoProfesional,
          estado: finalizar ? "FINALIZADO" : "BORRADOR",
          finalizadoEn: finalizar ? new Date() : null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new DocumentoClinicoBloqueadoError();
      }
      throw error;
    }
    await reemplazarRelaciones(tx, id, datos);
    return { id };
  });
}

export async function anularDocumentoClinicoRepositorio(
  id: string,
  motivo: string,
  usuarioId: string,
) {
  const resultado = await prisma.documentoClinico.updateMany({
    where: {
      id,
      estado: { not: "ANULADO" },
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    data: { estado: "ANULADO", anuladoEn: new Date(), motivoAnulacion: motivo },
  });
  if (resultado.count) return { id };
  const existente = await prisma.documentoClinico.findFirst({
    where: {
      id,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: { id: true },
  });
  if (!existente) throw new DocumentoClinicoNoEncontradoError();
  throw new DocumentoClinicoBloqueadoError();
}
