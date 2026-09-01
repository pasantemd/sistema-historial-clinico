import { prisma } from "@/servicios/base-datos/prisma";

import type {
  CatalogoFicha,
  CertificadoFicha,
  FichaDetalle,
  FichaPdfDto,
  FichaResumen,
  Recomendacion,
  TrabajadorParaFicha,
} from "@/modulos/fichas-ocupacionales/tipos";
import type { EntradaFicha } from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";
import { FichaNoEncontradaError } from "@/modulos/fichas-ocupacionales/errores";

function aFechaISO(valor: Date | string | null | undefined): string {
  if (!valor) return "";
  const fecha = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toISOString().slice(0, 10);
}

function numeroFormulario(valor: number | null | undefined): number | "" {
  return valor === null || valor === undefined ? "" : valor;
}

function textoFormulario(valor: string | null | undefined): string {
  return valor ?? "";
}

export async function consultarTrabajadorResumen(usuarioId: string, trabajadorId: string) {
  const trabajador = await prisma.trabajador.findFirst({
    where: { id: trabajadorId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    select: { nombres: true, apellidos: true, numeroDocumento: true, sexo: true, fechaNacimiento: true },
  });
  return trabajador;
}

export async function consultarTrabajadorParaFicha(usuarioId: string, trabajadorId: string): Promise<TrabajadorParaFicha | null> {
  const trabajador = await prisma.trabajador.findFirst({
    where: { id: trabajadorId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      numeroDocumento: true,
      sexo: true,
      fechaNacimiento: true,
      empresaId: true,
      departamentoId: true,
      asignacionesLaborales: {
        where: { activa: true, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
        orderBy: { actualizadoEn: "desc" },
        select: { id: true, empresaId: true, departamentoId: true },
      },
    },
  });
  if (!trabajador) return null;
  const vinculo = trabajador.asignacionesLaborales.find(
    (item) => item.empresaId === trabajador.empresaId && item.departamentoId === trabajador.departamentoId,
  ) ?? trabajador.asignacionesLaborales[0];
  return {
    id: trabajador.id,
    nombres: trabajador.nombres,
    apellidos: trabajador.apellidos,
    numeroDocumento: trabajador.numeroDocumento,
    sexo: trabajador.sexo,
    fechaNacimiento: aFechaISO(trabajador.fechaNacimiento),
    empresaId: vinculo?.empresaId ?? trabajador.empresaId,
    departamentoId: vinculo?.departamentoId ?? trabajador.departamentoId,
    vinculoLaboralId: vinculo?.id ?? null,
    tieneOrganizacionActiva: Boolean(vinculo),
  };
}

export async function consultarCatalogoFicha(usuarioId: string): Promise<CatalogoFicha> {
  const [empresas, departamentos] = await Promise.all([
    prisma.empresa.findMany({
      where: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } },
      select: {
        id: true,
        ruc: true,
        razonSocial: true,
        nombreComercial: true,
        actividadEconomicaCodigo: true,
        actividadEconomicaDescripcion: true,
        direccion: true,
        telefono: true,
        correo: true,
      },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.departamento.findMany({ where: { estado: "ACTIVO", empresa: { usuariosAutorizados: { some: { usuarioId } } } }, select: { id: true, empresaId: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ]);
  return { empresas, departamentos };
}

export async function consultarDatosAutocompletado(usuarioId: string, trabajadorId: string, empresaId: string) {
  const [trabajador, empresa] = await Promise.all([
    prisma.trabajador.findFirst({
      where: { id: trabajadorId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
      select: { nombres: true, apellidos: true, numeroDocumento: true, sexo: true, fechaNacimiento: true },
    }),
    prisma.empresa.findFirst({
      where: { id: empresaId, usuariosAutorizados: { some: { usuarioId } } },
      select: { razonSocial: true, ruc: true, actividadEconomicaCodigo: true, actividadEconomicaDescripcion: true },
    }),
  ]);
  return { trabajador, empresa };
}

export async function listarFichas(usuarioId: string, trabajadorId: string): Promise<FichaResumen[]> {
  const fichas = await prisma.fichaOcupacional.findMany({
    where: { trabajadorId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      trabajadorId: true,
      empresaId: true,
      departamentoId: true,
      tipoEvaluacion: true,
      estado: true,
      fechaAtencion: true,
      aptitudMedica: true,
      creadoEn: true,
      actualizadoEn: true,
    },
  });
  return fichas.map((ficha) => ({
    id: ficha.id,
    trabajadorId: ficha.trabajadorId,
    empresaId: ficha.empresaId,
    departamentoId: ficha.departamentoId,
    tipoEvaluacion: ficha.tipoEvaluacion,
      estado: ficha.estado,
      fechaAtencion: aFechaISO(ficha.fechaAtencion),
      aptitudMedica: ficha.aptitudMedica as FichaResumen["aptitudMedica"],
      creadoEn: aFechaISO(ficha.creadoEn),
      actualizadoEn: aFechaISO(ficha.actualizadoEn),
    }));
}

export interface FichaGlobalResumen {
  id: string; trabajadorId: string; tipoEvaluacion: string; estado: string;
  fechaAtencion: string; empresaNombreHistorico: string | null;
  trabajadorNombre: string; trabajadorDocumento: string;
}

export async function listarFichasGlobales(usuarioId: string) {
  const fichas = await prisma.fichaOcupacional.findMany({
    where: { empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    select: {
      id: true, trabajadorId: true, tipoEvaluacion: true, estado: true,
      fechaAtencion: true, empresaNombreHistorico: true,
      trabajador: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
    },
    orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }],
    take: 100,
  });
  return fichas.map((ficha) => ({
    ...ficha,
    fechaAtencion: aFechaISO(ficha.fechaAtencion),
    trabajadorNombre: `${ficha.trabajador.apellidos} ${ficha.trabajador.nombres}`,
    trabajadorDocumento: ficha.trabajador.numeroDocumento,
  }));
}

export async function listarFichasPaginadas(
  usuarioId: string,
  filtros: { busqueda?: string; tipoEvaluacion?: string; estado?: string },
  pagina = 1,
  tamanoPagina?: number,
): Promise<{ fichas: FichaGlobalResumen[]; total: number; pagina: number; totalPaginas: number }> {
  const take = tamanoPagina ?? 15;
  const where: Record<string, unknown> = {
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  };
  if (filtros.tipoEvaluacion) where.tipoEvaluacion = filtros.tipoEvaluacion;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.busqueda) {
    const termino = filtros.busqueda.trim();
    where.OR = [
      { empresaNombreHistorico: { contains: termino, mode: "insensitive" } },
      { trabajador: { OR: [
        { nombres: { contains: termino, mode: "insensitive" } },
        { apellidos: { contains: termino, mode: "insensitive" } },
        { numeroDocumento: { contains: termino } },
      ]}},
    ];
  }
  const total = await prisma.fichaOcupacional.count({ where: where as never });
  const totalPaginas = Math.max(1, Math.ceil(total / take));
  const pag = Math.min(pagina, totalPaginas);
  const fichas = await prisma.fichaOcupacional.findMany({
    where: where as never,
    select: {
      id: true, trabajadorId: true, tipoEvaluacion: true, estado: true,
      fechaAtencion: true, empresaNombreHistorico: true,
      trabajador: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
    },
    orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }],
    skip: (pag - 1) * take,
    take,
  });
  return {
    fichas: fichas.map((ficha) => ({
      id: ficha.id, trabajadorId: ficha.trabajadorId,
      tipoEvaluacion: ficha.tipoEvaluacion, estado: ficha.estado,
      fechaAtencion: aFechaISO(ficha.fechaAtencion),
      empresaNombreHistorico: ficha.empresaNombreHistorico,
      trabajadorNombre: `${ficha.trabajador.apellidos} ${ficha.trabajador.nombres}`,
      trabajadorDocumento: ficha.trabajador.numeroDocumento,
    })),
    total, pagina: pag, totalPaginas,
  };
}

export async function consultarFichaDetalle(usuarioId: string, trabajadorIdOFichaId: string, fichaId?: string): Promise<FichaDetalle | null> {
  const id = fichaId ?? trabajadorIdOFichaId;
  const trabajadorId = fichaId ? trabajadorIdOFichaId : undefined;
  const ficha = await prisma.fichaOcupacional.findFirst({
    where: { id, trabajadorId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    include: {
      trabajador: { select: { nombres: true, apellidos: true, numeroDocumento: true, sexo: true } },
      empresa: { select: { razonSocial: true, ruc: true } },
      departamento: { select: { nombre: true } },
    },
  });
  if (!ficha) return null;
  return {
    id: ficha.id,
    trabajadorId: ficha.trabajadorId,
    empresaId: ficha.empresaId,
    departamentoId: ficha.departamentoId,
    tipoEvaluacion: ficha.tipoEvaluacion,
    estado: ficha.estado,
    fechaAtencion: aFechaISO(ficha.fechaAtencion),
    aptitudMedica: ficha.aptitudMedica as FichaResumen["aptitudMedica"],
    creadoEn: aFechaISO(ficha.creadoEn),
    actualizadoEn: aFechaISO(ficha.actualizadoEn),
    empresa: ficha.empresaNombreHistorico || ficha.empresa.razonSocial,
    empresaRuc: ficha.empresaRucHistorico || ficha.empresa.ruc,
    departamento: ficha.departamentoNombreHistorico || ficha.departamento.nombre,
    trabajador: {
      nombres: ficha.trabajador.nombres,
      apellidos: ficha.trabajador.apellidos,
      numeroDocumento: ficha.trabajador.numeroDocumento,
      sexo: ficha.trabajador.sexo,
    },
    primerApellido: ficha.primerApellido,
    segundoApellido: ficha.segundoApellido,
    primerNombre: ficha.primerNombre,
    segundoNombre: ficha.segundoNombre,
    puestoTrabajoCIUO: ficha.puestoTrabajoCIUO,
    profesionalNombres: ficha.profesionalNombres,
    profesionalCodigoMedico: ficha.profesionalCodigoMedico,
    observacionesAptitud: ficha.observacionesAptitud,
  };
}

export async function consultarFichaPdf(
  usuarioId: string,
  fichaId: string,
): Promise<FichaPdfDto | null> {
  const ficha = await prisma.fichaOcupacional.findFirst({
    where: { id: fichaId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    include: {
      trabajador: {
        select: {
          nombres: true,
          apellidos: true,
          numeroDocumento: true,
        },
      },
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      diagnosticos: {
        orderBy: { creadoEn: "asc" },
        include: {
          enfermedad: { select: { codigo: true, descripcion: true } },
        },
      },
    },
  });
  if (!ficha) return null;

  const valores = mapearFichaAFormulario({
    ...ficha,
    diagnosticos: ficha.diagnosticos.map((diagnostico) => ({
      enfermedadId: diagnostico.enfermedadId,
      codigo: diagnostico.enfermedad.codigo,
      descripcion: diagnostico.enfermedad.descripcion,
      pre: diagnostico.pre,
      def: diagnostico.def,
    })),
  });

  return {
    id: ficha.id,
    estado: ficha.estado,
    tipoEvaluacion: ficha.tipoEvaluacion,
    fechaAtencion: aFechaISO(ficha.fechaAtencion),
    trabajador: `${ficha.trabajador.apellidos} ${ficha.trabajador.nombres}`,
    numeroDocumento: ficha.trabajador.numeroDocumento,
    empresa: ficha.empresaNombreHistorico || ficha.empresa.razonSocial,
    departamento:
      ficha.departamentoNombreHistorico || ficha.departamento.nombre,
    profesional: ficha.profesionalNombres,
    numeroArchivo: ficha.numeroArchivo,
    valores,
  };
}

function mapearRecomendaciones(valor: unknown): Recomendacion[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const descripcion = (item as { descripcion?: unknown }).descripcion;
    return typeof descripcion === "string" && descripcion.trim() ? [{ descripcion }] : [];
  });
}

export async function consultarCertificadoFicha(usuarioId: string, fichaId: string): Promise<CertificadoFicha | null> {
  const ficha = await prisma.fichaOcupacional.findFirst({
    where: { id: fichaId, estado: "FINALIZADA", empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    include: {
      trabajador: {
        select: {
          nombres: true,
          apellidos: true,
          numeroDocumento: true,
          sexo: true,
          fechaNacimiento: true,
        },
      },
      empresa: {
        select: {
          razonSocial: true,
          nombreComercial: true,
          ruc: true,
          actividadEconomicaCodigo: true,
          actividadEconomicaDescripcion: true,
          direccion: true,
          telefono: true,
          correo: true,
        },
      },
      departamento: { select: { nombre: true } },
      diagnosticos: {
        orderBy: { creadoEn: "asc" },
        include: { enfermedad: { select: { codigo: true, descripcion: true } } },
      },
    },
  });
  if (!ficha) return null;
  return {
    id: ficha.id,
    trabajadorId: ficha.trabajadorId,
    registroDiarioId: ficha.registroDiarioId,
    estado: ficha.estado,
    tipoEvaluacion: ficha.tipoEvaluacion,
    fechaAtencion: aFechaISO(ficha.fechaAtencion),
    finalizadoEn: ficha.finalizadoEn?.toISOString() ?? "",
    aptitudMedica: ficha.aptitudMedica as CertificadoFicha["aptitudMedica"],
    observacionesAptitud: ficha.observacionesAptitud,
    retiroObservacion: ficha.retiroObservacion,
    profesionalNombres: ficha.profesionalNombres,
    profesionalCodigoMedico: ficha.profesionalCodigoMedico,
    firmaTrabajadorAcepta: ficha.firmaTrabajadorAcepta,
    firmaTrabajadorFecha: aFechaISO(ficha.firmaTrabajadorFecha),
    empresa: {
      ...ficha.empresa,
      razonSocial: ficha.empresaNombreHistorico || ficha.establecimiento || ficha.empresa.razonSocial,
      ruc: ficha.empresaRucHistorico || ficha.ruc || ficha.empresa.ruc,
      actividadEconomicaCodigo: ficha.ciiu || ficha.empresa.actividadEconomicaCodigo,
    },
    departamento: ficha.departamentoNombreHistorico || ficha.departamento.nombre,
    trabajador: {
      ...ficha.trabajador,
      sexo: ficha.trabajador.sexo,
      fechaNacimiento: aFechaISO(ficha.trabajador.fechaNacimiento),
    },
    diagnosticos: ficha.diagnosticos.map((item) => ({
      enfermedadId: item.enfermedadId,
      codigo: item.enfermedad.codigo,
      descripcion: item.enfermedad.descripcion,
      pre: item.pre,
      def: item.def,
    })),
    recomendaciones: mapearRecomendaciones(ficha.recomendaciones),
    institucionSistema: ficha.institucionSistema,
    ruc: ficha.ruc,
    ciiu: ficha.ciiu,
    establecimiento: ficha.establecimiento,
    numeroFormulario: ficha.numeroHistoriaClinica,
    numeroArchivo: ficha.numeroArchivo,
    primerApellido: ficha.primerApellido,
    segundoApellido: ficha.segundoApellido,
    primerNombre: ficha.primerNombre,
    segundoNombre: ficha.segundoNombre,
    puestoTrabajoCIUO: ficha.puestoTrabajoCIUO,
  };
}

export async function obtenerFichaParaEditar(usuarioId: string, trabajadorId: string, fichaId: string): Promise<EntradaFicha> {
  const ficha = await prisma.fichaOcupacional.findFirst({
    where: { id: fichaId, trabajadorId, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    include: {
      diagnosticos: {
        orderBy: { creadoEn: "asc" },
        include: { enfermedad: { select: { codigo: true, descripcion: true } } },
      },
    },
  });
  if (!ficha) throw new FichaNoEncontradaError();
  return mapearFichaAFormulario({
    ...ficha,
    diagnosticos: ficha.diagnosticos.map((diagnostico) => ({
      enfermedadId: diagnostico.enfermedadId,
      codigo: diagnostico.enfermedad.codigo,
      descripcion: diagnostico.enfermedad.descripcion,
      pre: diagnostico.pre,
      def: diagnostico.def,
    })),
  });
}

export function mapearFichaAFormulario(ficha: Record<string, unknown>): EntradaFicha {
  const texto = (clave: string) => textoFormulario(ficha[clave] as string | null | undefined);
  const numero = (clave: string) => numeroFormulario(ficha[clave] as number | null | undefined);
  const fecha = (clave: string) => aFechaISO(ficha[clave] as Date | string | null | undefined);
  const booleano = (clave: string) => Boolean(ficha[clave]);
  const arreglo = (clave: string, defecto: unknown[] = []) => {
    const valor = ficha[clave];
    return Array.isArray(valor) ? valor : defecto;
  };
  const objeto = (clave: string, defecto: Record<string, unknown>) => {
    const valor = ficha[clave];
    return valor && typeof valor === "object" ? (valor as Record<string, unknown>) : defecto;
  };

  return {
    trabajadorId: texto("trabajadorId"),
    registroDiarioId: texto("registroDiarioId"),
    empresaId: texto("empresaId"),
    departamentoId: texto("departamentoId"),
    tipoEvaluacion: (ficha.tipoEvaluacion as EntradaFicha["tipoEvaluacion"]) ?? "INGRESO",

    institucionSistema: texto("institucionSistema"),
    ruc: texto("ruc"),
    ciiu: texto("ciiu"),
    establecimiento: texto("establecimiento"),
    numeroHistoriaClinica: texto("numeroHistoriaClinica"),

    primerApellido: texto("primerApellido"),
    segundoApellido: texto("segundoApellido"),
    primerNombre: texto("primerNombre"),
    segundoNombre: texto("segundoNombre"),

    atencionEmbarazada: booleano("atencionEmbarazada"),
    atencionDiscapacidad: booleano("atencionDiscapacidad"),
    atencionCatastrofica: booleano("atencionCatastrofica"),
    atencionLactancia: booleano("atencionLactancia"),
    atencionAdultoMayor: booleano("atencionAdultoMayor"),

    sexo: (ficha.sexo as EntradaFicha["sexo"]) ?? "NO_ESPECIFICADO",
    fechaNacimiento: fecha("fechaNacimiento"),
    edad: numero("edad"),
    grupoSanguineo: texto("grupoSanguineo"),
    lateralidad: texto("lateralidad"),

    puestoTrabajoCIUO: texto("puestoTrabajoCIUO"),
    fechaAtencion: fecha("fechaAtencion"),
    fechaIngresoTrabajo: fecha("fechaIngresoTrabajo"),
    fechaReintegro: fecha("fechaReintegro"),
    fechaSalida: fecha("fechaSalida"),
    observacionMotivo: texto("observacionMotivo"),

    antecedentesClinicosQuirurgicos: texto("antecedentesClinicosQuirurgicos"),
    antecedentesFamiliares: texto("antecedentesFamiliares"),
    autorizaTransfusiones: texto("autorizaTransfusiones"),
    tratamientoHormonal: texto("tratamientoHormonal"),
    tratamientoHormonalCual: texto("tratamientoHormonalCual"),
    fechaUltimaMenstruacion: fecha("fechaUltimaMenstruacion"),
    gestas: numero("gestas"),
    partos: numero("partos"),
    cesareas: numero("cesareas"),
    abortos: numero("abortos"),
    planificacionFamiliarFemenina: texto("planificacionFamiliarFemenina"),
    metodoPlanificacionFemenina: texto("metodoPlanificacionFemenina"),
    examenesFemeninos: arreglo("examenesFemeninos"),
    planificacionFamiliarMasculina: texto("planificacionFamiliarMasculina"),
    metodoPlanificacionMasculina: texto("metodoPlanificacionMasculina"),
    examenesMasculinos: arreglo("examenesMasculinos"),
    consumoSustancias: arreglo("consumoSustancias"),
    actividadFisica: texto("actividadFisica"),
    actividadFisicaCual: texto("actividadFisicaCual"),
    actividadFisicaTiempo: texto("actividadFisicaTiempo"),
    medicacionHabitual: texto("medicacionHabitual"),
    medicacionHabitualCual: texto("medicacionHabitualCual"),
    medicacionHabitualCantidad: texto("medicacionHabitualCantidad"),
    observacionEstiloVida: texto("observacionEstiloVida"),

    noRefiereSintomatologia: booleano("noRefiereSintomatologia"),
    descripcionProblemaActual: texto("descripcionProblemaActual"),

    temperatura: numero("temperatura"),
    presionArterial: texto("presionArterial"),
    frecuenciaCardiaca: numero("frecuenciaCardiaca"),
    frecuenciaRespiratoria: numero("frecuenciaRespiratoria"),
    saturacionOxigeno: numero("saturacionOxigeno"),
    peso: numero("peso"),
    talla: numero("talla"),
    imc: numero("imc"),
    perimetroAbdominal: numero("perimetroAbdominal"),
    examenFisico: objeto("examenFisico", {}) as EntradaFicha["examenFisico"],
    observacionesExamenFisico: texto("observacionesExamenFisico"),

    actividadesRiesgo: arreglo("actividadesRiesgo"),
    factoresRiesgo: objeto("factoresRiesgo", { fisico: [], seguridad: [], quimico: [], biologico: [], ergonomico: [], psicosocial: [] }) as EntradaFicha["factoresRiesgo"],
    medidasPreventivas: texto("medidasPreventivas"),

    antecedentesLaborales: arreglo("antecedentesLaborales"),
    actividadesExtralaborales: arreglo("actividadesExtralaborales"),

    resultadosExamenes: arreglo("resultadosExamenes"),
    observacionesResultados: texto("observacionesResultados"),

    diagnosticos: arreglo("diagnosticos"),

    aptitudMedica: (ficha.aptitudMedica as EntradaFicha["aptitudMedica"]) ?? null,
    observacionesAptitud: texto("observacionesAptitud"),

    recomendaciones: arreglo("recomendaciones"),

    retiroRealizaEvaluacion: texto("retiroRealizaEvaluacion"),
    retiroRelacionadoTrabajo: texto("retiroRelacionadoTrabajo"),
    retiroObservacion: texto("retiroObservacion"),

    profesionalNombres: texto("profesionalNombres"),
    profesionalCodigoMedico: texto("profesionalCodigoMedico"),

    firmaTrabajadorAcepta: booleano("firmaTrabajadorAcepta"),
    firmaTrabajadorFecha: fecha("firmaTrabajadorFecha"),
  };
}
