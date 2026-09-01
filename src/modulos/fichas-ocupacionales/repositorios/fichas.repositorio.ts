import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/servicios/base-datos/prisma";
import {
  EmpresaDepartamentoInvalidoError,
  FichaAnuladaError,
  FichaFinalizadaError,
  FichaNoEncontradaError,
  TrabajadorNoEncontradoError,
} from "@/modulos/fichas-ocupacionales/errores";
import type { DatosFicha } from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";
import { obtenerNumeroCorrelativo } from "@/servicios/base-datos/numero-correlativo";

interface DependenciaFicha {
  trabajadorId: string;
  empresaId: string;
  departamentoId: string;
  registroDiarioId?: string;
}

type ClienteTransaccional = Prisma.TransactionClient;

interface MaestrosFicha {
  trabajador: {
    id: string;
    nombres: string;
    apellidos: string;
    numeroDocumento: string;
    sexo: string;
    fechaNacimiento: Date | null;
  };
  empresa: {
    id: string;
    ruc: string;
    razonSocial: string;
    nombreComercial: string | null;
    actividadEconomicaCodigo: string | null;
  };
  departamento: { id: string; nombre: string };
  asignacionLaboral: { id: string };
  historicos: { empresa: string; ruc: string | null; departamento: string | null } | null;
}

function texto(valor: string | undefined | null): string | null {
  const limpio = valor?.trim();
  return limpio || null;
}

function fechaCivil(valor: string | undefined | null): Date | null {
  if (!valor) return null;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function partir(textoCompleto: string): [string, string] {
  const partes = textoCompleto.trim().split(/\s+/).filter(Boolean);
  return [partes[0] ?? "", partes.slice(1).join(" ")];
}

function calcularEdad(fechaNacimiento: Date | null, fechaAtencion: Date | null): number | null {
  if (!fechaNacimiento) return null;
  const referencia = fechaAtencion ?? new Date();
  let edad = referencia.getUTCFullYear() - fechaNacimiento.getUTCFullYear();
  const mes = referencia.getUTCMonth() - fechaNacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && referencia.getUTCDate() < fechaNacimiento.getUTCDate())) edad -= 1;
  return edad;
}

function sanearJson(valor: unknown): Prisma.InputJsonValue {
  if (valor === null || valor === undefined) return null as unknown as Prisma.InputJsonValue;
  if (Array.isArray(valor)) return valor.map(sanearJson);
  if (typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor)
        .filter(([, contenido]) => contenido !== undefined)
        .map(([clave, contenido]) => [clave, sanearJson(contenido)]),
    );
  }
  return valor as string | number | boolean;
}

async function validarOrganizacion(
  tx: ClienteTransaccional,
  usuarioId: string,
  { trabajadorId, empresaId: empresaEntradaId, departamentoId: departamentoEntradaId, registroDiarioId }: DependenciaFicha,
): Promise<MaestrosFicha> {
  const registro = registroDiarioId ? await tx.registroDiarioAtencion.findFirst({ where: { id: registroDiarioId, trabajadorId, estado: { not: "ANULADO" } }, select: { empresaId: true, departamentoId: true, empresaNombreHistorico: true, empresaRucHistorico: true, departamentoNombreHistorico: true } }) : null;
  if (registroDiarioId && (!registro || !registro.departamentoId)) throw new EmpresaDepartamentoInvalidoError();
  const empresaId = registro?.empresaId ?? empresaEntradaId;
  const departamentoId = registro?.departamentoId ?? departamentoEntradaId;
  const exigirActivo = !registro;
  const [trabajador, empresa, departamento, asignacionLaboral] = await Promise.all([
    tx.trabajador.findFirst({
      where: {
        id: trabajadorId,
        estadoLaboral: { not: "RETIRADO" },
        OR: [
          { empresaId, departamentoId },
          { asignacionesLaborales: { some: { empresaId, departamentoId, ...(exigirActivo ? { activa: true } : {}) } } },
        ],
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        numeroDocumento: true,
        sexo: true,
        fechaNacimiento: true,
      },
    }),
    tx.empresa.findFirst({
      where: { id: empresaId, usuariosAutorizados: { some: { usuarioId } }, ...(exigirActivo ? { estado: "ACTIVO" as const } : {}) },
      select: {
        id: true,
        ruc: true,
        razonSocial: true,
        nombreComercial: true,
        actividadEconomicaCodigo: true,
      },
    }),
    tx.departamento.findFirst({
      where: { id: departamentoId, empresaId, ...(exigirActivo ? { estado: "ACTIVO" as const } : {}) },
      select: { id: true, nombre: true },
    }),
    tx.asignacionLaboral.findFirst({
      where: { trabajadorId, empresaId, departamentoId, ...(exigirActivo ? { activa: true } : {}) },
      select: { id: true },
    }),
  ]);
  if (!trabajador) throw new TrabajadorNoEncontradoError();
  if (!empresa || !departamento || !asignacionLaboral) throw new EmpresaDepartamentoInvalidoError();
  return {
    trabajador: { ...trabajador, sexo: trabajador.sexo },
    empresa,
    departamento,
    asignacionLaboral,
    historicos: registro
      ? { empresa: registro.empresaNombreHistorico, ruc: registro.empresaRucHistorico, departamento: registro.departamentoNombreHistorico }
      : null,
  };
}

function mapearDatos(datos: DatosFicha, maestros: MaestrosFicha) {
  const [primerNombre, segundoNombre] = partir(maestros.trabajador.nombres);
  const [primerApellido, segundoApellido] = partir(maestros.trabajador.apellidos);
  const fechaAtencion = fechaCivil(datos.fechaAtencion);

  const numeroHistoriaClinica =
    datos.numeroHistoriaClinica !== undefined && datos.numeroHistoriaClinica !== null
      ? String(datos.numeroHistoriaClinica)
      : maestros.trabajador.numeroDocumento;

  return {
    institucionSistema: "PRIVADO",
    ruc: maestros.empresa.ruc,
    ciiu: maestros.empresa.actividadEconomicaCodigo,
    establecimiento: maestros.empresa.nombreComercial || maestros.empresa.razonSocial,
    numeroHistoriaClinica,
    primerApellido,
    segundoApellido: texto(segundoApellido),
    primerNombre,
    segundoNombre: texto(segundoNombre),
    atencionEmbarazada: datos.atencionEmbarazada,
    atencionDiscapacidad: datos.atencionDiscapacidad,
    atencionCatastrofica: datos.atencionCatastrofica,
    atencionLactancia: datos.atencionLactancia,
    atencionAdultoMayor: datos.atencionAdultoMayor,
    sexo: maestros.trabajador.sexo,
    fechaNacimiento: maestros.trabajador.fechaNacimiento,
    edad: datos.edad ?? calcularEdad(maestros.trabajador.fechaNacimiento, fechaAtencion),
    grupoSanguineo: texto(datos.grupoSanguineo),
    lateralidad: texto(datos.lateralidad),
    puestoTrabajoCIUO: texto(datos.puestoTrabajoCIUO),
    fechaAtencion,
    fechaIngresoTrabajo: fechaCivil(datos.fechaIngresoTrabajo),
    fechaReintegro: fechaCivil(datos.fechaReintegro),
    fechaSalida: fechaCivil(datos.fechaSalida),
    observacionMotivo: texto(datos.observacionMotivo),
    antecedentesClinicosQuirurgicos: texto(datos.antecedentesClinicosQuirurgicos),
    antecedentesFamiliares: texto(datos.antecedentesFamiliares),
    autorizaTransfusiones: texto(datos.autorizaTransfusiones),
    tratamientoHormonal: texto(datos.tratamientoHormonal),
    tratamientoHormonalCual: texto(datos.tratamientoHormonalCual),
    fechaUltimaMenstruacion: fechaCivil(datos.fechaUltimaMenstruacion),
    gestas: datos.gestas ?? null,
    partos: datos.partos ?? null,
    cesareas: datos.cesareas ?? null,
    abortos: datos.abortos ?? null,
    planificacionFamiliarFemenina: texto(datos.planificacionFamiliarFemenina),
    metodoPlanificacionFemenina: texto(datos.metodoPlanificacionFemenina),
    examenesFemeninos: sanearJson(datos.examenesFemeninos),
    planificacionFamiliarMasculina: texto(datos.planificacionFamiliarMasculina),
    metodoPlanificacionMasculina: texto(datos.metodoPlanificacionMasculina),
    examenesMasculinos: sanearJson(datos.examenesMasculinos),
    consumoSustancias: sanearJson(datos.consumoSustancias),
    actividadFisica: texto(datos.actividadFisica),
    actividadFisicaCual: texto(datos.actividadFisicaCual),
    actividadFisicaTiempo: texto(datos.actividadFisicaTiempo),
    medicacionHabitual: texto(datos.medicacionHabitual),
    medicacionHabitualCual: texto(datos.medicacionHabitualCual),
    medicacionHabitualCantidad: texto(datos.medicacionHabitualCantidad),
    observacionEstiloVida: texto(datos.observacionEstiloVida),
    noRefiereSintomatologia: datos.noRefiereSintomatologia,
    descripcionProblemaActual: texto(datos.descripcionProblemaActual),
    temperatura: datos.temperatura ?? null,
    presionArterial: texto(datos.presionArterial),
    frecuenciaCardiaca: datos.frecuenciaCardiaca ?? null,
    frecuenciaRespiratoria: datos.frecuenciaRespiratoria ?? null,
    saturacionOxigeno: datos.saturacionOxigeno ?? null,
    peso: datos.peso ?? null,
    talla: datos.talla ?? null,
    imc: datos.imc ?? null,
    perimetroAbdominal: datos.perimetroAbdominal ?? null,
    examenFisico: sanearJson(datos.examenFisico),
    observacionesExamenFisico: texto(datos.observacionesExamenFisico),
    actividadesRiesgo: sanearJson(datos.actividadesRiesgo),
    factoresRiesgo: sanearJson(datos.factoresRiesgo),
    medidasPreventivas: texto(datos.medidasPreventivas),
    antecedentesLaborales: sanearJson(datos.antecedentesLaborales),
    actividadesExtralaborales: sanearJson(datos.actividadesExtralaborales),
    resultadosExamenes: sanearJson(datos.resultadosExamenes),
    observacionesResultados: texto(datos.observacionesResultados),
    aptitudMedica: datos.aptitudMedica,
    observacionesAptitud: texto(datos.observacionesAptitud),
    recomendaciones: sanearJson(datos.recomendaciones),
    retiroRealizaEvaluacion: texto(datos.retiroRealizaEvaluacion),
    retiroRelacionadoTrabajo: texto(datos.retiroRelacionadoTrabajo),
    retiroObservacion: texto(datos.retiroObservacion),
    profesionalNombres: texto(datos.profesionalNombres),
    profesionalCodigoMedico: texto(datos.profesionalCodigoMedico),
    firmaTrabajadorAcepta: datos.firmaTrabajadorAcepta,
    firmaTrabajadorFecha: fechaCivil(datos.firmaTrabajadorFecha),
    tipoEvaluacion: datos.tipoEvaluacion,
    empresaNombreHistorico: maestros.historicos?.empresa ?? maestros.empresa.razonSocial,
    empresaRucHistorico: maestros.historicos?.ruc ?? maestros.empresa.ruc,
    departamentoNombreHistorico: maestros.historicos?.departamento ?? maestros.departamento.nombre,
  };
}

async function reemplazarDiagnosticos(
  tx: ClienteTransaccional,
  fichaId: string,
  datos: DatosFicha["diagnosticos"],
): Promise<void> {
  const ids = datos.map(({ enfermedadId }) => enfermedadId);
  if (new Set(ids).size !== ids.length) throw new Error("No se puede repetir un diagnóstico CIE-10 en la misma ficha.");
  if (ids.length > 0) {
    const enfermedades = await tx.enfermedadCie10.findMany({
      where: { id: { in: ids }, activa: true },
      select: { id: true },
    });
    if (enfermedades.length !== ids.length) throw new Error("Uno o más diagnósticos CIE-10 no existen o están inactivos.");
  }
  await tx.diagnosticoFicha.deleteMany({ where: { fichaId } });
  if (datos.length > 0) {
    await tx.diagnosticoFicha.createMany({
      data: datos.map(({ enfermedadId, pre, def }) => ({ fichaId, enfermedadId, pre, def })),
    });
  }
}

async function exigirBorrador(tx: ClienteTransaccional, id: string, trabajadorId: string, usuarioId: string) {
  const ficha = await tx.fichaOcupacional.findFirst({
    where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    select: { id: true, estado: true, trabajadorId: true },
  });
  if (!ficha || ficha.trabajadorId !== trabajadorId) throw new FichaNoEncontradaError();
  if (ficha.estado !== "BORRADOR") throw new FichaFinalizadaError();
  return ficha;
}

export async function crearBorradorFicha(datos: DatosFicha, usuarioId: string): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const maestros = await validarOrganizacion(tx, usuarioId, datos);
    await validarRegistroDiarioFicha(tx, datos.registroDiarioId, datos.trabajadorId);
    const numeroFicha = await obtenerNumeroCorrelativo(tx, "ficha-ocupacional");
    const ficha = await tx.fichaOcupacional.create({
      data: {
        ...mapearDatos(datos, maestros),
        trabajador: { connect: { id: datos.trabajadorId } },
        empresa: { connect: { id: maestros.empresa.id } },
        departamento: { connect: { id: maestros.departamento.id } },
        asignacionLaboral: { connect: { id: maestros.asignacionLaboral.id } },
        numeroFicha,
        registroDiario: datos.registroDiarioId ? { connect: { id: datos.registroDiarioId } } : undefined,
        usuario: { connect: { id: usuarioId } },
        creadoPor: { connect: { id: usuarioId } },
        actualizadoPor: { connect: { id: usuarioId } },
        estado: "BORRADOR",
      },
      select: { id: true },
    });
    await reemplazarDiagnosticos(tx, ficha.id, datos.diagnosticos);
    return ficha.id;
  });
}

export async function guardarBorradorFicha(id: string, datos: DatosFicha, usuarioId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await exigirBorrador(tx, id, datos.trabajadorId, usuarioId);
    const maestros = await validarOrganizacion(tx, usuarioId, datos);
    await validarRegistroDiarioFicha(tx, datos.registroDiarioId, datos.trabajadorId);
    await tx.fichaOcupacional.update({
      where: { id },
      data: {
        ...mapearDatos(datos, maestros),
        empresa: { connect: { id: maestros.empresa.id } },
        departamento: { connect: { id: maestros.departamento.id } },
        asignacionLaboral: { connect: { id: maestros.asignacionLaboral.id } },
        registroDiario: datos.registroDiarioId ? { connect: { id: datos.registroDiarioId } } : { disconnect: true },
        actualizadoPor: { connect: { id: usuarioId } },
      },
    });
    await reemplazarDiagnosticos(tx, id, datos.diagnosticos);
  });
}

export async function finalizarFichaRepositorio(
  id: string | null,
  datos: DatosFicha,
  usuarioId: string,
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const maestros = await validarOrganizacion(tx, usuarioId, datos);
    if (id) {
      const resultadoGuard = await tx.fichaOcupacional.updateMany({
        where: {
          id,
          trabajadorId: datos.trabajadorId,
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
        const existente = await tx.fichaOcupacional.findFirst({
          where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
          select: { estado: true, trabajadorId: true },
        });
        if (!existente || existente.trabajadorId !== datos.trabajadorId) {
          throw new FichaNoEncontradaError();
        }
        if (existente.estado === "FINALIZADA") throw new FichaFinalizadaError();
        throw new FichaAnuladaError();
      }
    }
    await validarRegistroDiarioFicha(tx, datos.registroDiarioId, datos.trabajadorId);
    const comunes = {
      ...mapearDatos(datos, maestros),
      empresa: { connect: { id: maestros.empresa.id } },
      departamento: { connect: { id: maestros.departamento.id } },
      asignacionLaboral: { connect: { id: maestros.asignacionLaboral.id } },
      registroDiario: datos.registroDiarioId ? { connect: { id: datos.registroDiarioId } } : undefined,
      actualizadoPor: { connect: { id: usuarioId } },
      estado: "FINALIZADA" as const,
      finalizadoEn: new Date(),
    };
    let fichaId = id;
    if (fichaId) {
      await tx.fichaOcupacional.update({ where: { id: fichaId }, data: comunes });
    } else {
      const numeroFicha = await obtenerNumeroCorrelativo(tx, "ficha-ocupacional");
      const creada = await tx.fichaOcupacional.create({
        data: {
          ...comunes,
          numeroFicha,
          trabajador: { connect: { id: datos.trabajadorId } },
          usuario: { connect: { id: usuarioId } },
          creadoPor: { connect: { id: usuarioId } },
        },
        select: { id: true },
      });
      fichaId = creada.id;
    }
    await reemplazarDiagnosticos(tx, fichaId, datos.diagnosticos);
    return fichaId;
  });
}

async function validarRegistroDiarioFicha(
  tx: ClienteTransaccional,
  registroDiarioId: string | undefined,
  trabajadorId: string,
): Promise<void> {
  if (!registroDiarioId) return;
  const registro = await tx.registroDiarioAtencion.findFirst({
    where: { id: registroDiarioId, trabajadorId },
    select: { id: true },
  });
  if (!registro) throw new Error("El registro diario no corresponde al trabajador.");
}

export async function anularFichaRepositorio(id: string, usuarioId: string): Promise<void> {
  const autorizada = await prisma.fichaOcupacional.findFirst({
    where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    select: { id: true },
  });
  if (!autorizada) throw new FichaNoEncontradaError();
  const resultado = await prisma.fichaOcupacional.updateMany({
    where: { id, estado: "BORRADOR" },
    data: { estado: "ANULADA", actualizadoPorId: usuarioId },
  });
  if (resultado.count) return;
  const existente = await prisma.fichaOcupacional.findUnique({ where: { id }, select: { estado: true } });
  if (!existente) throw new FichaNoEncontradaError();
  if (existente.estado === "FINALIZADA") throw new FichaFinalizadaError();
  throw new FichaAnuladaError();
}
