import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import { obtenerNumeroCorrelativo } from "@/servicios/base-datos/numero-correlativo";
import type { DatosEvaluacion } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import { asegurarMorbilidadEnCatalogo } from "@/modulos/morbilidades/repositorios/morbilidades.repositorio";
import {
  AlertaAlergiaRequiereConfirmacionError,
  AsignacionActivaRequeridaError,
  EvaluacionBloqueadaError,
  EvaluacionNoEncontradaError,
} from "@/modulos/evaluaciones-medicas/errores";
import { indicesMedicamentosAlergenosSinJustificar } from "@/modulos/evaluaciones-medicas/utilidades/normalizar-sustancia";

type Tx = Prisma.TransactionClient;
const fechaCivil = (valor?: string) =>
  valor ? new Date(`${valor}T00:00:00.000Z`) : null;
const texto = (valor?: string) => valor?.trim() || null;

async function contextoActivo(
  tx: Tx,
  usuarioId: string,
  trabajadorId: string,
  registroDiarioId?: string,
) {
  const trabajador = await tx.trabajador.findFirst({
    where: {
      id: trabajadorId,
      asignacionesLaborales: {
        some: { empresa: { usuariosAutorizados: { some: { usuarioId } } } },
      },
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      numeroDocumento: true,
      sexo: true,
      fechaNacimiento: true,
      asignacionesLaborales: {
        where: {
          activa: true,
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        take: 1,
        include: {
          empresa: { select: { id: true, razonSocial: true, ruc: true } },
          departamento: { select: { id: true, nombre: true } },
        },
      },
    },
  });
  let asignacion = trabajador?.asignacionesLaborales[0];
  let nombresHistoricos: {
    empresa: string;
    ruc: string;
    departamento: string;
    profesionalId: string | null;
    profesional: string | null;
  } | null = null;
  if (trabajador && registroDiarioId) {
    const registro = await tx.registroDiarioAtencion.findFirst({
      where: {
        id: registroDiarioId,
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
        profesionalId: true,
        profesionalNombreHistorico: true,
      },
    });
    if (!registro)
      throw new Error("El registro diario no corresponde al trabajador.");
    const asignacionHistorica = await tx.asignacionLaboral.findFirst({
      where: {
        trabajadorId,
        empresaId: registro.empresaId,
        departamentoId: registro.departamentoId ?? undefined,
      },
      include: {
        empresa: { select: { id: true, razonSocial: true, ruc: true } },
        departamento: { select: { id: true, nombre: true } },
      },
      orderBy: { creadoEn: "desc" },
    });
    if (!asignacionHistorica) throw new AsignacionActivaRequeridaError();
    asignacion = asignacionHistorica;
    nombresHistoricos = {
      empresa: registro.empresaNombreHistorico,
      ruc: registro.empresaRucHistorico ?? asignacionHistorica.empresa.ruc,
      departamento:
        registro.departamentoNombreHistorico ??
        asignacionHistorica.departamento.nombre,
      profesionalId: registro.profesionalId,
      profesional: registro.profesionalNombreHistorico,
    };
  }
  if (!trabajador || !asignacion) throw new AsignacionActivaRequeridaError();
  const profesionalResponsableId = nombresHistoricos?.profesionalId ?? usuarioId;
  const usuarioResponsable = await tx.usuario.findFirst({
        where: { id: profesionalResponsableId, estado: "ACTIVO" },
        select: { id: true, nombres: true, apellidos: true },
      });
  if (!usuarioResponsable)
    throw new Error("El profesional autenticado no está activo.");
  return {
    trabajador,
    asignacion,
    nombresHistoricos,
    profesionalResponsable: {
      id: usuarioResponsable.id,
      nombre:
        nombresHistoricos?.profesional ??
        `${usuarioResponsable.nombres} ${usuarioResponsable.apellidos}`,
    },
  };
}

function datosEscalares(datos: DatosEvaluacion) {
  return {
    fechaAtencion: fechaCivil(datos.fechaAtencion),
    morbilidad: texto(datos.morbilidad),
    motivoConsulta: texto(datos.motivoConsulta),
    sintomas: texto(datos.sintomas),
    tiempoEvolucion: texto(datos.tiempoEvolucion),
    observacionesMotivo: texto(datos.observacionesMotivo),
    temperatura: datos.temperatura ?? null,
    presionArterial: texto(datos.presionArterial),
    frecuenciaCardiaca: datos.frecuenciaCardiaca ?? null,
    frecuenciaRespiratoria: datos.frecuenciaRespiratoria ?? null,
    saturacionOxigeno: datos.saturacionOxigeno ?? null,
    peso: datos.peso ?? null,
    talla: datos.talla ?? null,
    antecedentesRelevantes: texto(datos.antecedentesRelevantes),
    examenFisico: texto(datos.examenFisico),
    observacionesClinicas: texto(datos.observacionesClinicas),
    observacionesDiagnostico: texto(datos.observacionesDiagnostico),
    indicaciones: texto(datos.indicaciones),
    recomendaciones: texto(datos.recomendaciones),
    reposoDias: datos.reposoDias ?? null,
    seguimiento: texto(datos.seguimiento),
    proximaConsulta: fechaCivil(datos.proximaConsulta),
  };
}

async function validarRegistroDiario(
  tx: Tx,
  id: string | undefined,
  trabajadorId: string,
  usuarioId: string,
) {
  if (!id) return;
  const registro = await tx.registroDiarioAtencion.findFirst({
    where: {
      id,
      trabajadorId,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: { id: true },
  });
  if (!registro)
    throw new Error("El registro diario no corresponde al trabajador.");
}
async function validarAlergias(
  tx: Tx,
  trabajadorId: string,
  datos: DatosEvaluacion,
) {
  const alergias = await tx.alergiaTrabajador.findMany({
    where: { trabajadorId, activa: true, tipo: "MEDICAMENTO" },
    select: { sustancia: true },
  });
  const invalidos = indicesMedicamentosAlergenosSinJustificar(
    datos.medicamentos,
    alergias,
  );
  if (invalidos.length)
    throw new AlertaAlergiaRequiereConfirmacionError(invalidos);
}

async function reemplazarRelaciones(
  tx: Tx,
  evaluacionId: string,
  trabajadorId: string,
  datos: DatosEvaluacion,
) {
  await validarAlergias(tx, trabajadorId, datos);
  const ids = datos.diagnosticos.map((item) => item.enfermedadId);
  if (new Set(ids).size !== ids.length)
    throw new Error("No repita diagnósticos CIE-10.");
  if (
    ids.length &&
    (await tx.enfermedadCie10.count({
      where: { id: { in: ids }, activa: true },
    })) !== ids.length
  )
    throw new Error("Uno o más diagnósticos CIE-10 no están disponibles.");
  await tx.diagnosticoEvaluacion.deleteMany({ where: { evaluacionId } });
  if (datos.diagnosticos.length)
    await tx.diagnosticoEvaluacion.createMany({
      data: datos.diagnosticos.map((item) => ({
        evaluacionId,
        enfermedadId: item.enfermedadId,
        pre: item.pre,
        def: item.def,
      })),
    });
  await tx.medicamentoEvaluacion.deleteMany({ where: { evaluacionId } });
  for (const item of datos.medicamentos) {
    const existente = await tx.medicamento.findFirst({
      where: {
        nombreGenerico: {
          equals: item.nombreGenerico.trim(),
          mode: "insensitive",
        },
        presentacion: { equals: item.presentacion.trim(), mode: "insensitive" },
      },
      select: { id: true },
    });
    const medicamento =
      existente ??
      (await tx.medicamento.create({
        data: {
          nombreGenerico: item.nombreGenerico.trim(),
          nombreComercial: texto(item.nombreComercial),
          presentacion: item.presentacion.trim(),
        },
        select: { id: true },
      }));
    await tx.medicamentoEvaluacion.create({
      data: {
        evaluacionId,
        medicamentoId: medicamento.id,
        cantidad: item.cantidad,
        dosis: texto(item.dosis),
        frecuencia: texto(item.frecuencia),
        duracion: texto(item.duracion),
        viaAdministracion: texto(item.viaAdministracion),
        indicaciones: texto(item.indicaciones),
        alertaAlergiaConfirmada: item.alertaAlergiaConfirmada,
        justificacionAlergia: texto(item.justificacionAlergia),
      },
    });
  }
}

async function exigirBorrador(tx: Tx, id: string, usuarioId: string) {
  const evaluacion = await tx.evaluacionMedica.findFirst({
    where: {
      id,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: { id: true, trabajadorId: true, estado: true },
  });
  if (!evaluacion) throw new EvaluacionNoEncontradaError();
  if (evaluacion.estado !== "BORRADOR") throw new EvaluacionBloqueadaError();
  return evaluacion;
}

async function crearEnTx(tx: Tx, datos: DatosEvaluacion, usuarioId: string) {
  await asegurarMorbilidadEnCatalogo(datos.morbilidad, tx);
  const { trabajador, asignacion, nombresHistoricos, profesionalResponsable } = await contextoActivo(
    tx,
    usuarioId,
    datos.trabajadorId,
    datos.registroDiarioId,
  );
  await validarRegistroDiario(
    tx,
    datos.registroDiarioId,
    trabajador.id,
    usuarioId,
  );
  const numeroEvaluacion = await obtenerNumeroCorrelativo(
    tx,
    "evaluacion-medica",
  );
  const evaluacion = await tx.evaluacionMedica.create({
    data: {
      ...datosEscalares(datos),
      numeroEvaluacion,
      trabajadorId: trabajador.id,
      empresaId: asignacion.empresa.id,
      departamentoId: asignacion.departamento.id,
      asignacionLaboralId: asignacion.id,
      registroDiarioId: datos.registroDiarioId || null,
      usuarioId: profesionalResponsable.id,
      creadoPorId: usuarioId,
      actualizadoPorId: usuarioId,
      profesionalNombreHistorico: profesionalResponsable.nombre,
      trabajadorNombreHistorico: `${trabajador.apellidos} ${trabajador.nombres}`,
      trabajadorDocumentoHistorico: trabajador.numeroDocumento,
      trabajadorSexoHistorico: trabajador.sexo,
      trabajadorNacimientoHistorico: trabajador.fechaNacimiento,
      empresaNombreHistorico:
        nombresHistoricos?.empresa ?? asignacion.empresa.razonSocial,
      empresaRucHistorico: nombresHistoricos?.ruc ?? asignacion.empresa.ruc,
      departamentoNombreHistorico:
        nombresHistoricos?.departamento ?? asignacion.departamento.nombre,
    },
    select: { id: true },
  });
  await reemplazarRelaciones(tx, evaluacion.id, trabajador.id, datos);
  return evaluacion.id;
}

async function guardarEnTx(
  tx: Tx,
  id: string,
  datos: DatosEvaluacion,
  usuarioId: string,
) {
  const evaluacion = await exigirBorrador(tx, id, usuarioId);
  if (evaluacion.trabajadorId !== datos.trabajadorId)
    throw new EvaluacionNoEncontradaError();
  await validarRegistroDiario(
    tx,
    datos.registroDiarioId,
    evaluacion.trabajadorId,
    usuarioId,
  );
  await asegurarMorbilidadEnCatalogo(datos.morbilidad, tx);
  await tx.evaluacionMedica.update({
    where: { id },
    data: {
      ...datosEscalares(datos),
      registroDiarioId: datos.registroDiarioId || null,
      actualizadoPorId: usuarioId,
    },
  });
  await reemplazarRelaciones(tx, id, evaluacion.trabajadorId, datos);
  return id;
}

export async function crearEvaluacion(
  datos: DatosEvaluacion,
  usuarioId: string,
) {
  return prisma.$transaction((tx) => crearEnTx(tx, datos, usuarioId));
}
export async function guardarEvaluacion(
  id: string,
  datos: DatosEvaluacion,
  usuarioId: string,
) {
  return prisma.$transaction((tx) => guardarEnTx(tx, id, datos, usuarioId));
}

export async function finalizarEvaluacion(
  id: string | null,
  datos: DatosEvaluacion,
  usuarioId: string,
) {
  return prisma.$transaction(async (tx) => {
    if (id) {
      const resultadoGuard = await tx.evaluacionMedica.updateMany({
        where: {
          id,
          estado: "BORRADOR",
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        data: {
          estado: "FINALIZADA",
          finalizadoEn: new Date(),
          actualizadoPorId: usuarioId,
        },
      });
      if (!resultadoGuard.count) {
        const actual = await tx.evaluacionMedica.findFirst({
          where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
          select: { estado: true },
        });
        if (!actual) throw new EvaluacionNoEncontradaError();
        if (actual.estado === "FINALIZADA") {
          return { evaluacionId: id, evaluacionFinalizada: false };
        }
        throw new EvaluacionBloqueadaError();
      }

      const evaluacion = await tx.evaluacionMedica.findFirst({
        where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
        select: { trabajadorId: true },
      });
      if (!evaluacion || evaluacion.trabajadorId !== datos.trabajadorId) {
        throw new EvaluacionNoEncontradaError();
      }
      await validarRegistroDiario(tx, datos.registroDiarioId, evaluacion.trabajadorId, usuarioId);
      await asegurarMorbilidadEnCatalogo(datos.morbilidad, tx);
      await tx.evaluacionMedica.update({
        where: { id },
        data: {
          ...datosEscalares(datos),
          registroDiarioId: datos.registroDiarioId || null,
          actualizadoPorId: usuarioId,
        },
      });
      await reemplazarRelaciones(tx, id, evaluacion.trabajadorId, datos);
      return { evaluacionId: id, evaluacionFinalizada: true };
    }

    const eid = await crearEnTx(tx, datos, usuarioId);
    const resultadoGuard = await tx.evaluacionMedica.updateMany({
      where: { id: eid, estado: "BORRADOR" },
      data: {
        estado: "FINALIZADA",
        finalizadoEn: new Date(),
        actualizadoPorId: usuarioId,
      },
    });
    if (!resultadoGuard.count) {
      const actual = await tx.evaluacionMedica.findFirst({
        where: {
          id: eid,
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        select: { estado: true },
      });
      if (!actual) throw new EvaluacionNoEncontradaError();
      if (actual.estado === "FINALIZADA") {
        return { evaluacionId: eid, evaluacionFinalizada: false };
      }
      throw new EvaluacionBloqueadaError();
    }
    return { evaluacionId: eid, evaluacionFinalizada: true };
  });
}

export async function anularEvaluacion(
  id: string,
  motivo: string,
  usuarioId: string,
) {
  const resultado = await prisma.evaluacionMedica.updateMany({
    where: {
      id,
      estado: "BORRADOR",
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    data: {
      estado: "ANULADA",
      motivoAnulacion: motivo,
      anuladaEn: new Date(),
      actualizadoPorId: usuarioId,
    },
  });
  if (!resultado.count) throw new EvaluacionBloqueadaError();
}
