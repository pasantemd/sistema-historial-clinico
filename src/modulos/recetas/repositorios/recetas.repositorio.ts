import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import type { EntradaReceta } from "@/modulos/recetas/validaciones/receta.schema";
import type { RecetaResumenDto } from "@/modulos/recetas/tipos";
import { coincideAlergiaMedicamento } from "@/modulos/evaluaciones-medicas/utilidades/normalizar-sustancia";
type Tx = Prisma.TransactionClient;

export function resolverProfesionalResponsableReceta({
  usuarioId,
  profesionalEvaluacionId,
  profesionalExistenteId,
}: {
  usuarioId: string;
  profesionalEvaluacionId?: string | null;
  profesionalExistenteId?: string | null;
}) {
  return profesionalEvaluacionId ?? profesionalExistenteId ?? usuarioId;
}

const fechaISO = (valor: Date | null) =>
  valor ? valor.toISOString().slice(0, 10) : null;

function fechaCivil(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

async function generarNumeroReceta(tx: Tx): Promise<string> {
  const resultado = await tx.$queryRaw<
    Array<{ sig: bigint }>
  >`SELECT nextval('receta_numero_seq')::bigint AS sig`;
  return `REC-${String(resultado[0].sig).padStart(3, "0")}`;
}

export async function cargarContextoReceta(
  usuarioId: string,
  trabajadorId: string,
  registroDiarioId?: string,
  evaluacionId?: string,
  fichaOcupacionalId?: string,
  documentoClinicoId?: string,
  baseDatos: Tx = prisma,
) {
  const trabajador = await baseDatos.trabajador.findFirst({
    where: {
      id: trabajadorId,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      numeroDocumento: true,
      fechaNacimiento: true,
      sexo: true,
      empresaId: true,
      departamentoId: true,
      asignacionesLaborales: {
        where: {
          activa: true,
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        take: 1,
        include: { empresa: true, departamento: true },
      },
      alergias: {
        where: { activa: true, tipo: "MEDICAMENTO" },
        orderBy: [{ severidad: "desc" }, { sustancia: "asc" }],
      },
    },
  });
  if (!trabajador) throw new Error("El trabajador no fue encontrado.");

  let diagnosticos: Array<{
    enfermedad: { codigo: string; descripcion: string };
    def: boolean;
    pre: boolean;
  }> = [];
  let origenEvaluacion: {
    empresaId: string;
    departamentoId: string;
    asignacionLaboralId: string;
    empresaNombreHistorico: string;
    empresaRucHistorico: string;
    departamentoNombreHistorico: string;
    estado: "BORRADOR" | "FINALIZADA" | "ANULADA";
    fechaAtencion: Date | null;
    usuarioId: string;
    trabajadorNombreHistorico: string;
    trabajadorDocumentoHistorico: string;
    trabajadorSexoHistorico: string | null;
    trabajadorNacimientoHistorico: Date | null;
    indicaciones: string | null;
    recomendaciones: string | null;
    morbilidad: string | null;
    receta: { id: string } | null;
    medicamentos: Array<{
      medicamentoId: string;
      cantidad: Prisma.Decimal | null;
      dosis: string | null;
      frecuencia: string | null;
      duracion: string | null;
      viaAdministracion: string | null;
      indicaciones: string | null;
      medicamento: {
        nombreGenerico: string;
        nombreComercial: string | null;
        presentacion: string;
      };
    }>;
  } | null = null;
  if (evaluacionId) {
    const evaluacion = await baseDatos.evaluacionMedica.findFirst({
      where: {
        id: evaluacionId,
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      select: {
        trabajadorId: true,
        empresaId: true,
        departamentoId: true,
        asignacionLaboralId: true,
        empresaNombreHistorico: true,
        empresaRucHistorico: true,
        departamentoNombreHistorico: true,
        estado: true,
        fechaAtencion: true,
        usuarioId: true,
        trabajadorNombreHistorico: true,
        trabajadorDocumentoHistorico: true,
        trabajadorSexoHistorico: true,
        trabajadorNacimientoHistorico: true,
        indicaciones: true,
        recomendaciones: true,
        morbilidad: true,
        receta: { select: { id: true } },
        medicamentos: {
          include: { medicamento: true },
          orderBy: { creadoEn: "asc" },
        },
        diagnosticos: {
          include: {
            enfermedad: { select: { codigo: true, descripcion: true } },
          },
          orderBy: [{ def: "desc" }, { pre: "desc" }],
        },
      },
    });
    if (!evaluacion || evaluacion.trabajadorId !== trabajadorId) {
      throw new Error("La evaluación médica no pertenece al trabajador.");
    }
    if (evaluacion.estado !== "FINALIZADA") {
      throw new Error(
        "La evaluación médica debe estar finalizada antes de crear una receta.",
      );
    }
    diagnosticos = evaluacion.diagnosticos;
    origenEvaluacion = evaluacion;
  }

  const fuentes = await Promise.all([
    registroDiarioId
      ? baseDatos.registroDiarioAtencion.findFirst({
          where: {
            id: registroDiarioId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          select: {
            trabajadorId: true,
            estado: true,
            diaAtencion: true,
            atencionMorbilidad: true,
            medicacion: true,
            procedimiento: true,
            profesionalId: true,
            empresaId: true,
            departamentoId: true,
            empresaNombreHistorico: true,
            empresaRucHistorico: true,
            departamentoNombreHistorico: true,
            recetas: {
              where: { estado: { not: "ANULADA" } },
              select: { id: true, numeroReceta: true, estado: true },
              orderBy: { creadoEn: "desc" },
              take: 1,
            },
            medicamentos: {
              select: {
                nombreSnapshot: true,
                unidadSnapshot: true,
                cantidadEntregada: true,
              },
              orderBy: { creadoEn: "asc" },
            },
          },
        })
      : null,
    fichaOcupacionalId
      ? baseDatos.fichaOcupacional.findFirst({
          where: {
            id: fichaOcupacionalId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          select: { trabajadorId: true },
        })
      : null,
    documentoClinicoId
      ? baseDatos.documentoClinico.findFirst({
          where: {
            id: documentoClinicoId,
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
          select: { trabajadorId: true, estado: true },
        })
      : null,
  ]);
  const [registro, ficha, documento] = fuentes;
  if (
    registroDiarioId &&
    (!registro || registro.trabajadorId !== trabajadorId)
  ) {
    throw new Error("El registro diario no pertenece al trabajador.");
  }
  if (registro?.estado === "ANULADO") {
    throw new Error(
      "No se puede asociar una receta a un registro diario anulado.",
    );
  }
  if (fichaOcupacionalId && (!ficha || ficha.trabajadorId !== trabajadorId)) {
    throw new Error("La ficha ocupacional no pertenece al trabajador.");
  }
  if (
    documentoClinicoId &&
    (!documento || documento.trabajadorId !== trabajadorId)
  ) {
    throw new Error("El documento clínico no pertenece al trabajador.");
  }
  if (documento?.estado === "ANULADO") {
    throw new Error(
      "No se puede asociar una receta a un documento clínico anulado.",
    );
  }

  let empresaId = trabajador.empresaId;
  let departamentoId: string | null = trabajador.departamentoId;
  let asignacion: (typeof trabajador.asignacionesLaborales)[number] | null =
    trabajador.asignacionesLaborales[0] ?? null;
  if (origenEvaluacion) {
    empresaId = origenEvaluacion.empresaId;
    departamentoId = origenEvaluacion.departamentoId;
    asignacion = await baseDatos.asignacionLaboral.findFirst({
      where: {
        id: origenEvaluacion.asignacionLaboralId,
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      include: { empresa: true, departamento: true },
    });
  } else if (registro) {
    empresaId = registro.empresaId;
    departamentoId = registro.departamentoId;
    asignacion = await baseDatos.asignacionLaboral.findFirst({
      where: {
        trabajadorId,
        empresaId: registro.empresaId,
        departamentoId: registro.departamentoId ?? undefined,
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      include: { empresa: true, departamento: true },
      orderBy: { creadoEn: "desc" },
    });
  }
  const [empresa, departamento, profesionales, profesionalOrigen] = await Promise.all([
    baseDatos.empresa.findFirst({
      where: {
        id: empresaId,
        usuariosAutorizados: { some: { usuarioId } },
      },
      select: {
        id: true,
        razonSocial: true,
        ruc: true,
        direccion: true,
        telefono: true,
      },
    }),
    departamentoId
      ? baseDatos.departamento.findFirst({
          where: { id: departamentoId, empresaId },
          select: { id: true, nombre: true },
        })
      : null,
    baseDatos.usuario.findMany({
      where: {
        estado: "ACTIVO",
        empresasAutorizadas: { some: { empresaId } },
        roles: {
          some: {
            rol: {
              permisos: {
                some: { permiso: { codigo: "receta.emitir" } },
              },
            },
          },
        },
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        codigoProfesional: true,
        especialidad: true,
      },
      orderBy: [{ apellidos: "asc" }],
    }),
    origenEvaluacion
      ? baseDatos.usuario.findUnique({
          where: { id: origenEvaluacion.usuarioId },
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            codigoProfesional: true,
            especialidad: true,
          },
        })
      : null,
  ]);
  const profesionalesDisponibles = [...profesionales];
  if (
    profesionalOrigen &&
    !profesionalesDisponibles.some((item) => item.id === profesionalOrigen.id)
  ) {
    profesionalesDisponibles.push(profesionalOrigen);
  }

  return {
    trabajador: {
      id: trabajador.id,
      nombre:
        origenEvaluacion?.trabajadorNombreHistorico ??
        `${trabajador.apellidos} ${trabajador.nombres}`,
      documento:
        origenEvaluacion?.trabajadorDocumentoHistorico ??
        trabajador.numeroDocumento,
      fechaNacimiento: origenEvaluacion
        ? fechaISO(origenEvaluacion.trabajadorNacimientoHistorico)
        : fechaISO(trabajador.fechaNacimiento),
      sexo: origenEvaluacion?.trabajadorSexoHistorico ?? trabajador.sexo,
    },
    empresa: empresa
      ? {
          id: empresa.id,
          nombre:
            origenEvaluacion?.empresaNombreHistorico ??
            registro?.empresaNombreHistorico ??
            empresa.razonSocial,
          ruc:
            origenEvaluacion?.empresaRucHistorico ??
            registro?.empresaRucHistorico ??
            empresa.ruc,
          direccion: empresa.direccion ?? null,
          telefono: empresa.telefono ?? null,
        }
      : null,
    departamento: departamento
      ? {
          id: departamento.id,
          nombre:
            origenEvaluacion?.departamentoNombreHistorico ??
            registro?.departamentoNombreHistorico ??
            departamento.nombre,
        }
      : null,
    asignacion: asignacion
      ? {
          id: asignacion.id,
          empresaId: asignacion.empresaId,
          departamentoId: asignacion.departamentoId,
          empresa: asignacion.empresa.razonSocial,
          departamento: asignacion.departamento.nombre,
        }
      : null,
    alergias: trabajador.alergias.map((alergia) => ({
      id: alergia.id,
      sustancia: alergia.sustancia,
      severidad: alergia.severidad,
      descripcion: alergia.descripcion ?? null,
    })),
    diagnosticos: diagnosticos.map((diagnostico) => ({
      codigo: diagnostico.enfermedad.codigo,
      descripcion: diagnostico.enfermedad.descripcion,
      def: diagnostico.def,
      pre: diagnostico.pre,
    })),
    profesionales: profesionalesDisponibles.map((profesional) => ({
      id: profesional.id,
      nombre: `${profesional.apellidos} ${profesional.nombres}`,
      codigoProfesional: profesional.codigoProfesional,
      especialidad: profesional.especialidad,
    })),
    registroDiarioId: registroDiarioId ?? null,
    registroDiario: registro
      ? {
          id: registroDiarioId!,
          recetaId: registro.recetas?.[0]?.id ?? null,
          numeroReceta: registro.recetas?.[0]?.numeroReceta ?? null,
          fecha: registro.diaAtencion.toISOString().slice(0, 10),
          morbilidad: registro.atencionMorbilidad,
          medicacion: registro.medicacion,
          procedimiento: registro.procedimiento,
          profesionalId: registro.profesionalId,
          medicamentos: registro.medicamentos.map((item) => ({
            nombre: item.nombreSnapshot,
            cantidadEntregada: Number(item.cantidadEntregada),
            unidad: item.unidadSnapshot,
          })),
        }
      : null,
    evaluacion: origenEvaluacion
      ? {
          id: evaluacionId!,
          recetaId: origenEvaluacion.receta?.id ?? null,
          fecha: fechaISO(origenEvaluacion.fechaAtencion),
          profesionalId: origenEvaluacion.usuarioId,
          indicaciones: origenEvaluacion.indicaciones,
          recomendaciones: origenEvaluacion.recomendaciones,
          morbilidad: origenEvaluacion.morbilidad,
          medicamentos: origenEvaluacion.medicamentos.map((item) => ({
            medicamentoId: item.medicamentoId,
            nombreGenerico: item.medicamento.nombreGenerico,
            nombreComercial: item.medicamento.nombreComercial,
            presentacion: item.medicamento.presentacion,
            cantidad: item.cantidad?.toString() ?? "",
            dosis: item.dosis,
            frecuencia: item.frecuencia,
            duracion: item.duracion,
            viaAdministracion: item.viaAdministracion,
            indicaciones: item.indicaciones,
          })),
        }
      : null,
  };
}

export async function buscarRecetaPorRegistroDiario(
  registroDiarioId: string,
  tx?: Tx,
) {
  const cliente = tx ?? prisma;
  return cliente.recetaMedica.findFirst({
    where: {
      registroDiarioId,
      estado: { not: "ANULADA" },
    },
    select: {
      id: true,
      numeroReceta: true,
      estado: true,
    },
    orderBy: { creadoEn: "desc" },
  });
}

export async function crearRecetaRepositorio(
  datos: EntradaReceta,
  usuarioId: string,
) {
  return prisma.$transaction((tx) =>
    crearRecetaRepositorioTx(tx, datos, usuarioId),
  );
}

export async function crearRecetaRepositorioTx(
  tx: Tx,
  datos: EntradaReceta,
  usuarioId: string,
) {
  if (datos.registroDiarioId) {
    const existente = await buscarRecetaPorRegistroDiario(datos.registroDiarioId, tx);
    if (existente) {
      throw new Error("Este Registro Diario ya tiene una receta asociada.");
    }
  }

  const contexto = await cargarContextoReceta(
    usuarioId,
    datos.trabajadorId,
    datos.registroDiarioId || undefined,
    datos.evaluacionId || undefined,
    datos.fichaOcupacionalId || undefined,
    datos.documentoClinicoId || undefined,
    tx,
  );
  if (!contexto.empresa) {
    throw new Error("No se pudo determinar la empresa del trabajador.");
  }
  if (!contexto.asignacion) {
    throw new Error("El trabajador no tiene una asignación laboral activa.");
  }

  const profesionalIdSeguro = resolverProfesionalResponsableReceta({
    usuarioId,
    profesionalEvaluacionId: contexto.evaluacion?.profesionalId,
  });
  const profesional = await tx.usuario.findUnique({
    where: { id: profesionalIdSeguro },
    select: {
      nombres: true,
      apellidos: true,
      codigoProfesional: true,
      especialidad: true,
      estado: true,
    },
  });
  if (!profesional || profesional.estado !== "ACTIVO") {
    throw new Error("El profesional no fue encontrado o está inactivo.");
  }

  return tx.recetaMedica.create({
    data: {
      registroDiarioId: datos.registroDiarioId || null,
      evaluacionId: datos.evaluacionId || null,
      fichaOcupacionalId: datos.fichaOcupacionalId || null,
      documentoClinicoId: datos.documentoClinicoId || null,
      trabajadorId: datos.trabajadorId,
      empresaId: contexto.empresa!.id,
      departamentoId: contexto.departamento?.id ?? null,
      asignacionLaboralId: contexto.asignacion!.id,
      profesionalId: profesionalIdSeguro,
      numeroReceta: await generarNumeroReceta(tx),
      fechaEmision: fechaCivil(datos.fechaEmision),
      estado: "BORRADOR",
      indicacionesGenerales: datos.indicacionesGenerales || null,
      recomendaciones: datos.recomendaciones || null,
      observaciones: datos.observaciones || null,
      trabajadorNombreHistorico: contexto.trabajador.nombre,
      trabajadorDocumentoHistorico: contexto.trabajador.documento,
      trabajadorSexoHistorico: contexto.trabajador.sexo,
      trabajadorNacimientoHistorico: contexto.trabajador.fechaNacimiento
        ? fechaCivil(contexto.trabajador.fechaNacimiento)
        : null,
      empresaNombreHistorico: contexto.empresa!.nombre,
      empresaRucHistorico: contexto.empresa!.ruc,
      empresaDireccionHistorica: contexto.empresa!.direccion,
      empresaTelefonoHistorico: contexto.empresa!.telefono,
      departamentoNombreHistorico: contexto.departamento?.nombre ?? null,
      profesionalNombreHistorico: `${profesional.apellidos} ${profesional.nombres}`,
      profesionalCodigoHistorico: profesional.codigoProfesional,
      profesionalEspecialidadHistorica: profesional.especialidad,
      diagnosticosHistoricos: contexto.diagnosticos,
      creadoPorId: usuarioId,
      medicamentos: {
        create: datos.medicamentos.map((medicamento, indice) => ({
          medicamentoId: medicamento.medicamentoId || null,
          nombreMedicamentoHistorico: medicamento.nombreMedicamentoHistorico,
          nombreGenericoHistorico: medicamento.nombreGenericoHistorico || null,
          nombreComercialHistorico:
            medicamento.nombreComercialHistorico || null,
          presentacionHistorica: medicamento.presentacionHistorica,
          concentracionHistorica: medicamento.concentracionHistorica || null,
          cantidad: medicamento.cantidad,
          dosis: medicamento.dosis,
          frecuencia: medicamento.frecuencia,
          intervaloHoras: medicamento.intervaloHoras ?? null,
          duracion: medicamento.duracion,
          viaAdministracion: medicamento.viaAdministracion,
          indicaciones: medicamento.indicaciones || null,
          observaciones: medicamento.observaciones || null,
          orden: indice,
        })),
      },
    },
    select: { id: true, numeroReceta: true },
  });
}

export async function verificarAlergiasReceta(
  medicamentos: Array<{ nombre: string; nombreGenerico?: string | null }>,
  alergias: Array<{
    sustancia: string;
    severidad: string;
    descripcion?: string | null;
  }>,
): Promise<
  Array<{
    indice: number;
    sustancia: string;
    severidad: string;
    reaccion: string;
  }>
> {
  const alertas: Array<{
    indice: number;
    sustancia: string;
    severidad: string;
    reaccion: string;
  }> = [];
  medicamentos.forEach((medicamento, indice) => {
    for (const alergia of alergias) {
      if (
        coincideAlergiaMedicamento(medicamento.nombre, alergia.sustancia) ||
        coincideAlergiaMedicamento(
          medicamento.nombreGenerico ?? "",
          alergia.sustancia,
        )
      ) {
        alertas.push({
          indice,
          sustancia: alergia.sustancia,
          severidad: alergia.severidad,
          reaccion: alergia.descripcion ?? "",
        });
        break;
      }
    }
  });
  return alertas;
}

export async function emitirRecetaRepositorio(
  id: string,
  usuarioId: string,
  confirmarAlergia: boolean,
  justificacion?: string,
) {
  return prisma.$transaction(async (tx) => {
    const receta = await tx.recetaMedica.findUnique({
      where: { id },
      select: {
        id: true,
        empresa: {
          select: {
            usuariosAutorizados: {
              where: { usuarioId },
              select: { usuarioId: true },
            },
          },
        },
        estado: true,
        medicamentos: {
          select: {
            nombreMedicamentoHistorico: true,
            nombreGenericoHistorico: true,
          },
        },
        trabajador: {
          select: {
            alergias: {
              where: { activa: true, tipo: "MEDICAMENTO" },
              select: {
                sustancia: true,
                severidad: true,
                descripcion: true,
              },
            },
          },
        },
      },
    });
    if (!receta) throw new Error("La receta no fue encontrada.");
    if (receta.empresa.usuariosAutorizados.length === 0)
      throw new Error("La receta no fue encontrada.");
    if (receta.estado === "ANULADA") {
      throw new Error("La receta está anulada.");
    }
    if (receta.estado === "EMITIDA") return { id: receta.id };
    if (receta.medicamentos.length === 0) {
      throw new Error(
        "Agregue al menos un medicamento antes de emitir la receta.",
      );
    }

    const alertas = await verificarAlergiasReceta(
      receta.medicamentos.map((medicamento) => ({
        nombre: medicamento.nombreMedicamentoHistorico,
        nombreGenerico: medicamento.nombreGenericoHistorico,
      })),
      receta.trabajador.alergias,
    );
    if (alertas.length > 0 && (!confirmarAlergia || !justificacion?.trim())) {
      throw new Error(
        "Debe confirmar la alerta y justificar clínicamente la prescripción.",
      );
    }

    try {
      return await tx.recetaMedica.update({
        where: { id, estado: "BORRADOR" },
        data: {
          estado: "EMITIDA",
          emitidaEn: new Date(),
          alergiaConfirmada: alertas.length > 0,
          justificacionAlergia:
            alertas.length > 0 ? justificacion!.trim() : null,
          alergiaConfirmadaPorId: alertas.length > 0 ? usuarioId : null,
          alergiaConfirmadaEn: alertas.length > 0 ? new Date() : null,
        },
        select: { id: true },
      });
    } catch (error) {
      if (!(
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      )) {
        throw error;
      }
      const actual = await tx.recetaMedica.findUnique({
        where: { id },
        select: { id: true, estado: true },
      });
      if (actual?.estado === "EMITIDA") return { id: actual.id };
      if (actual?.estado === "ANULADA")
        throw new Error("La receta está anulada.");
      throw new Error("La receta ya no está disponible para emisión.");
    }
  });
}

export async function actualizarRecetaRepositorio(
  id: string,
  datos: EntradaReceta,
  usuarioId: string,
) {
  const contexto = await cargarContextoReceta(
    usuarioId,
    datos.trabajadorId,
    datos.registroDiarioId || undefined,
    datos.evaluacionId || undefined,
    datos.fichaOcupacionalId || undefined,
    datos.documentoClinicoId || undefined,
  );
  const existente = await prisma.recetaMedica.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        profesionalId: true,
        empresa: {
          select: {
            usuariosAutorizados: {
              where: { usuarioId },
              select: { usuarioId: true },
            },
          },
        },
      },
    });
  if (!existente || existente.empresa.usuariosAutorizados.length === 0)
    throw new Error("La receta no fue encontrada.");
  if (existente.estado !== "BORRADOR") {
    throw new Error("Solo se puede editar una receta en borrador.");
  }

  const profesionalIdSeguro = resolverProfesionalResponsableReceta({
    usuarioId,
    profesionalEvaluacionId: contexto.evaluacion?.profesionalId,
    profesionalExistenteId: existente.profesionalId,
  });
  const profesional = await prisma.usuario.findUnique({
      where: { id: profesionalIdSeguro },
      select: {
        nombres: true,
        apellidos: true,
        codigoProfesional: true,
        especialidad: true,
        estado: true,
      },
    });
  if (!profesional || profesional.estado !== "ACTIVO") {
    throw new Error("El profesional no fue encontrado o está inactivo.");
  }
  if (!contexto.empresa) {
    throw new Error("No se pudo determinar la empresa del trabajador.");
  }

  try {
    return await prisma.recetaMedica.update({
      where: { id, estado: "BORRADOR" },
      data: {
        registroDiarioId: datos.registroDiarioId || null,
        evaluacionId: datos.evaluacionId || null,
        fichaOcupacionalId: datos.fichaOcupacionalId || null,
        documentoClinicoId: datos.documentoClinicoId || null,
        trabajadorId: contexto.trabajador.id,
        empresaId: contexto.empresa.id,
        departamentoId: contexto.departamento?.id ?? null,
        asignacionLaboralId: contexto.asignacion?.id ?? null,
        profesionalId: profesionalIdSeguro,
        profesionalNombreHistorico: `${profesional.apellidos} ${profesional.nombres}`,
        profesionalCodigoHistorico: profesional.codigoProfesional,
        profesionalEspecialidadHistorica: profesional.especialidad,
        trabajadorNombreHistorico: contexto.trabajador.nombre,
        trabajadorDocumentoHistorico: contexto.trabajador.documento,
        trabajadorSexoHistorico: contexto.trabajador.sexo,
        trabajadorNacimientoHistorico: contexto.trabajador.fechaNacimiento
          ? fechaCivil(contexto.trabajador.fechaNacimiento)
          : null,
        empresaNombreHistorico: contexto.empresa.nombre,
        empresaRucHistorico: contexto.empresa.ruc,
        empresaDireccionHistorica: contexto.empresa.direccion,
        empresaTelefonoHistorico: contexto.empresa.telefono,
        departamentoNombreHistorico: contexto.departamento?.nombre ?? null,
        diagnosticosHistoricos: contexto.diagnosticos,
        fechaEmision: fechaCivil(datos.fechaEmision),
        indicacionesGenerales: datos.indicacionesGenerales || null,
        recomendaciones: datos.recomendaciones || null,
        observaciones: datos.observaciones || null,
        alergiaConfirmada: false,
        justificacionAlergia: null,
        alergiaConfirmadaPorId: null,
        alergiaConfirmadaEn: null,
        medicamentos: {
          deleteMany: {},
          create: datos.medicamentos.map((medicamento, indice) => ({
            medicamentoId: medicamento.medicamentoId || null,
            nombreMedicamentoHistorico: medicamento.nombreMedicamentoHistorico,
            nombreGenericoHistorico:
              medicamento.nombreGenericoHistorico || null,
            nombreComercialHistorico:
              medicamento.nombreComercialHistorico || null,
            presentacionHistorica: medicamento.presentacionHistorica,
            concentracionHistorica: medicamento.concentracionHistorica || null,
            cantidad: medicamento.cantidad,
            dosis: medicamento.dosis,
            frecuencia: medicamento.frecuencia,
            intervaloHoras: medicamento.intervaloHoras ?? null,
            duracion: medicamento.duracion,
            viaAdministracion: medicamento.viaAdministracion,
            indicaciones: medicamento.indicaciones || null,
            observaciones: medicamento.observaciones || null,
            orden: indice,
          })),
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new Error("Solo se puede editar una receta en borrador.");
    }
    throw error;
  }
}

export async function anularRecetaRepositorio(
  id: string,
  motivo: string,
  usuarioId: string,
) {
  const autorizada = await prisma.recetaMedica.findFirst({
    where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    select: { id: true },
  });
  if (!autorizada) throw new Error("La receta no fue encontrada.");
  const resultado = await prisma.recetaMedica.updateMany({
    where: {
      id,
      estado: { not: "ANULADA" },
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    data: {
      estado: "ANULADA",
      anuladaEn: new Date(),
      motivoAnulacion: motivo,
    },
  });
  if (resultado.count) return { id };

  const receta = await prisma.recetaMedica.findFirst({
    where: {
      id,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: { estado: true },
  });
  if (!receta) throw new Error("La receta no fue encontrada.");
  throw new Error("La receta ya está anulada.");
}

export async function consultarRecetaRepositorio(
  usuarioId: string,
  id: string,
) {
  return prisma.recetaMedica.findFirst({
    where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    include: {
      medicamentos: { orderBy: { orden: "asc" } },
      trabajador: { select: { alergias: { where: { activa: true } } } },
    },
  });
}

function construirWhereRecetas(filtro: {
  numero?: string;
  trabajador?: string;
  documento?: string;
  fecha?: string;
  empresa?: string;
  profesional?: string;
  estado?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filtro.numero)
    where.numeroReceta = { contains: filtro.numero, mode: "insensitive" };
  if (filtro.trabajador)
    where.trabajadorNombreHistorico = {
      contains: filtro.trabajador,
      mode: "insensitive",
    };
  if (filtro.documento)
    where.trabajadorDocumentoHistorico = { contains: filtro.documento };
  if (filtro.fecha) where.fechaEmision = fechaCivil(filtro.fecha);
  if (filtro.empresa)
    where.empresaNombreHistorico = {
      contains: filtro.empresa,
      mode: "insensitive",
    };
  if (filtro.profesional)
    where.profesionalNombreHistorico = {
      contains: filtro.profesional,
      mode: "insensitive",
    };
  if (filtro.estado) where.estado = filtro.estado;
  return where;
}

const TAMANO_PAGINA_RECETAS = 15;

export async function listarRecetasPaginadas(
  usuarioId: string,
  filtro: {
    numero?: string;
    trabajador?: string;
    documento?: string;
    fecha?: string;
    empresa?: string;
    profesional?: string;
    estado?: string;
  } = {},
  pagina = 1,
  tamanoPagina?: number,
): Promise<{
  recetas: RecetaResumenDto[];
  total: number;
  pagina: number;
  totalPaginas: number;
}> {
  const take = tamanoPagina ?? TAMANO_PAGINA_RECETAS;
  const where = {
    ...construirWhereRecetas(filtro),
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  };
  const total = await prisma.recetaMedica.count({ where: where as never });
  const totalPaginas = Math.max(1, Math.ceil(total / take));
  const pag = Math.min(pagina, totalPaginas);
  const items = await prisma.recetaMedica.findMany({
    where: where as never,
    include: { medicamentos: { select: { id: true } } },
    orderBy: [{ fechaEmision: "desc" }, { creadoEn: "desc" }],
    skip: (pag - 1) * take,
    take,
  });
  return {
    recetas: items.map((receta) => ({
      id: receta.id,
      numeroReceta: receta.numeroReceta,
      fechaEmision: receta.fechaEmision,
      estado: receta.estado,
      trabajadorNombreHistorico: receta.trabajadorNombreHistorico,
      empresaNombreHistorico: receta.empresaNombreHistorico,
      profesionalNombreHistorico: receta.profesionalNombreHistorico,
      registroDiarioId: receta.registroDiarioId,
      totalMedicamentos: receta.medicamentos.length,
    })),
    total,
    pagina: pag,
    totalPaginas,
  };
}

export async function listarRecetasRepositorio(
  usuarioId: string,
  filtro: {
    numero?: string;
    trabajador?: string;
    documento?: string;
    fecha?: string;
    empresa?: string;
    profesional?: string;
    estado?: string;
  } = {},
): Promise<RecetaResumenDto[]> {
  const where = {
    ...construirWhereRecetas(filtro),
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  };
  const items = await prisma.recetaMedica.findMany({
    where: where as never,
    include: { medicamentos: { select: { id: true } } },
    orderBy: [{ fechaEmision: "desc" }, { creadoEn: "desc" }],
    take: 100,
  });
  return items.map((receta) => ({
    id: receta.id,
    numeroReceta: receta.numeroReceta,
    fechaEmision: receta.fechaEmision,
    estado: receta.estado,
    trabajadorNombreHistorico: receta.trabajadorNombreHistorico,
    empresaNombreHistorico: receta.empresaNombreHistorico,
    profesionalNombreHistorico: receta.profesionalNombreHistorico,
    registroDiarioId: receta.registroDiarioId,
    totalMedicamentos: receta.medicamentos.length,
  }));
}

export async function consultarRecetaPorEvaluacion(
  usuarioId: string,
  evaluacionId: string,
): Promise<string | null> {
  const receta = await prisma.recetaMedica.findFirst({
    where: {
      evaluacionId,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: { id: true },
    orderBy: { creadoEn: "desc" },
  });
  return receta?.id ?? null;
}
