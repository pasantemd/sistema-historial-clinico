import { prisma } from "@/servicios/base-datos/prisma";
import type {
  FiltrosReportes,
  ReportesData,
  DatosGraficoBarras,
  DatosDiagnosticoFrecuente,
  DatosGraficoDonut,
} from "../tipos";
import { normalizarFiltrosReportes } from "../servicios/resolver-periodo-reportes";
import { requerirAccesoEmpresa } from "@/modulos/empresas/servicios/acceso-empresa.servicio";
import { normalizarMorbilidad } from "@/modulos/morbilidades/utilidades/normalizar-morbilidad";
import { consultarMedicamentosEntregadosReporte } from "./medicamentos-entregados.consulta";

const COLORES_PALETA = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#38BDF8",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
];

function construirDonde(
  filtros: FiltrosReportes,
  campoFecha: string,
  usuarioId: string,
  campoProfesional?: "profesionalId" | "usuarioId",
) {
  const condiciones: Record<string, unknown> = {
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  };
  if (filtros.fechaDesde) {
    const prev = (condiciones[campoFecha] as Record<string, unknown>) || {};
    condiciones[campoFecha] = {
      ...prev,
      gte: new Date(`${filtros.fechaDesde}T00:00:00.000Z`),
    };
  }
  if (filtros.fechaHasta) {
    const prev = (condiciones[campoFecha] as Record<string, unknown>) || {};
    condiciones[campoFecha] = {
      ...prev,
      lte: new Date(`${filtros.fechaHasta}T23:59:59.999Z`),
    };
  }
  if (filtros.empresaId) condiciones.empresaId = filtros.empresaId;
  if (filtros.departamentoId)
    condiciones.departamentoId = filtros.departamentoId;
  if (filtros.trabajadorId) condiciones.trabajadorId = filtros.trabajadorId;
  if (filtros.profesionalId && campoProfesional)
    condiciones[campoProfesional] = filtros.profesionalId;
  return condiciones;
}

function isoFecha(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function consultarReportes(
  usuarioId: string,
  filtros: FiltrosReportes,
): Promise<ReportesData> {
  filtros = normalizarFiltrosReportes(filtros);
  if (filtros.empresaId) {
    await requerirAccesoEmpresa(usuarioId, filtros.empresaId);
  }

  const wD = construirDonde(
    filtros,
    "diaAtencion",
    usuarioId,
    "profesionalId",
  );
  const wE = construirDonde(
    filtros,
    "fechaAtencion",
    usuarioId,
    "usuarioId",
  );
  const wF = construirDonde(
    filtros,
    "fechaAtencion",
    usuarioId,
    "usuarioId",
  );
  const wR = construirDonde(
    filtros,
    "fechaEmision",
    usuarioId,
    "profesionalId",
  );
  const wC = construirDonde(
    filtros,
    "fecha",
    usuarioId,
    "profesionalId",
  );

  const [
    cntReg,
    cntEval,
    cntFich,
    cntRec,
    rowsReg,
    rowsEval,
    rowsFich,
    rowsRec,
    rowsCit,
    emp,
    gRegistrosDia,
    gEvaluacionesDia,
    gEmp,
    gDep,
    gFichasDia,
    gTipoFicha,
    gEstCita,
    gEstRec,
    diag,
    gMorbilidadesEval,
    gMorbilidadesReg,
    medicamentosEntregados,
  ] = await Promise.all([
    prisma.registroDiarioAtencion.count({
      where: { ...wD, estado: { not: "ANULADO" } },
    }),
    prisma.evaluacionMedica.count({
      where: { ...wE, estado: { not: "ANULADA" } },
    }),
    prisma.fichaOcupacional.count({
      where: { ...wF, estado: { not: "ANULADA" } },
    }),
    prisma.recetaMedica.count({ where: { ...wR, estado: "EMITIDA" } }),
    prisma.registroDiarioAtencion.findMany({
      where: { ...wD, estado: { not: "ANULADO" } },
      select: {
        id: true,
        diaAtencion: true,
        apellidosNombres: true,
        cedula: true,
        empresaNombreHistorico: true,
        atencionMorbilidad: true,
        profesionalNombreHistorico: true,
        estado: true,
      },
      orderBy: { diaAtencion: "desc" },
      take: 50,
    }),
    prisma.evaluacionMedica.findMany({
      where: { ...wE, estado: { not: "ANULADA" } },
      select: {
        id: true,
        fechaAtencion: true,
        trabajadorNombreHistorico: true,
        motivoConsulta: true,
        empresaNombreHistorico: true,
        estado: true,
      },
      orderBy: { fechaAtencion: "desc" },
      take: 50,
    }),
    prisma.fichaOcupacional.findMany({
      where: { ...wF, estado: { not: "ANULADA" } },
      select: {
        id: true,
        fechaAtencion: true,
        tipoEvaluacion: true,
        estado: true,
        empresaNombreHistorico: true,
        trabajador: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fechaAtencion: "desc" },
      take: 50,
    }),
    prisma.recetaMedica.findMany({
      where: { ...wR },
      select: {
        id: true,
        fechaEmision: true,
        trabajadorNombreHistorico: true,
        estado: true,
        empresaNombreHistorico: true,
        profesionalNombreHistorico: true,
        _count: { select: { medicamentos: true } },
      },
      orderBy: { fechaEmision: "desc" },
      take: 50,
    }),
    prisma.citaMedica.findMany({
      where: { ...wC },
      select: {
        id: true,
        fecha: true,
        horaInicio: true,
        motivo: true,
        estado: true,
        trabajador: { select: { nombres: true, apellidos: true } },
        profesional: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fecha: "desc" },
      take: 50,
    }),
    prisma.empresa.findMany({
      where: {
        estado: "ACTIVO",
        id: filtros.empresaId,
        usuariosAutorizados: { some: { usuarioId } },
      },
      select: { id: true, razonSocial: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.registroDiarioAtencion.groupBy({
      by: ["diaAtencion"],
      where: { ...wD, estado: { not: "ANULADO" } } as never,
      _count: { id: true },
      orderBy: { diaAtencion: "asc" },
    }),
    prisma.evaluacionMedica.groupBy({
      by: ["fechaAtencion"],
      where: {
        ...wE,
        fechaAtencion: {
          ...(wE.fechaAtencion as Record<string, unknown> | undefined),
          not: null,
        },
        estado: { not: "ANULADA" },
      } as never,
      _count: { id: true },
      orderBy: { fechaAtencion: "asc" },
    }),
    prisma.registroDiarioAtencion.groupBy({
      by: ["empresaNombreHistorico"],
      where: { ...wD, estado: { not: "ANULADO" } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.registroDiarioAtencion.groupBy({
      by: ["departamentoNombreHistorico"],
      where: {
        ...wD,
        departamentoNombreHistorico: { not: null },
        estado: { not: "ANULADO" },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.fichaOcupacional.groupBy({
      by: ["fechaAtencion"],
      where: {
        ...wF,
        fechaAtencion: {
          ...(wF.fechaAtencion as Record<string, unknown> | undefined),
          not: null,
        },
        estado: { not: "ANULADA" },
      } as never,
      _count: { id: true },
      orderBy: { fechaAtencion: "asc" },
    }),
    prisma.fichaOcupacional.groupBy({
      by: ["tipoEvaluacion"],
      where: { ...wF, estado: { not: "ANULADA" } },
      _count: { id: true },
    }),
    prisma.citaMedica.groupBy({
      by: ["estado"],
      where: { ...wC },
      _count: { id: true },
    }),
    prisma.recetaMedica.groupBy({
      by: ["estado"],
      where: { ...wR },
      _count: { id: true },
    }),
    prisma.diagnosticoFicha
      .groupBy({
        by: ["enfermedadId"],
        where: {
          ficha: {
            is: { ...wF, estado: { not: "ANULADA" } },
          },
        },
        _count: { enfermedadId: true },
        orderBy: { _count: { enfermedadId: "desc" } },
        take: 10,
      })
      .then(async (grupos) => {
        if (grupos.length === 0) return [] as DatosDiagnosticoFrecuente[];
        const ids = grupos.map((g) => g.enfermedadId);
        const enfermedades = await prisma.enfermedadCie10.findMany({
          where: { id: { in: ids } },
          select: { id: true, codigo: true, descripcion: true },
        });
        const mapa = new Map(enfermedades.map((e) => [e.id, e]));
        return grupos.map((g) => {
          const enfermedad = mapa.get(g.enfermedadId);

          return {
            codigo: enfermedad?.codigo ?? "—",
            descripcion: enfermedad?.descripcion ?? "Descripción no disponible",
            valor: g._count.enfermedadId,
          };
        });
      }),
    prisma.evaluacionMedica.groupBy({
      by: ["morbilidad"],
      where: {
        ...wE,
        morbilidad: { not: null },
        estado: { not: "ANULADA" },
      } as never,
      _count: { id: true },
    }),
    prisma.registroDiarioAtencion.groupBy({
      by: ["atencionMorbilidad"],
      where: {
        ...wD,
        atencionMorbilidad: { not: "" },
        estado: { not: "ANULADO" },
        evaluaciones: {
          none: {
            estado: { not: "ANULADA" },
          },
        },
      },
      _count: { id: true },
    }),
    consultarMedicamentosEntregadosReporte(usuarioId, filtros),
  ]);

  const diarios: ReportesData["diarios"] = rowsReg.map((r) => ({
    fecha: isoFecha(r.diaAtencion),
    trabajador: r.apellidosNombres,
    documento: r.cedula,
    empresa: r.empresaNombreHistorico,
    atencion: r.atencionMorbilidad,
    profesional: r.profesionalNombreHistorico ?? "Sin profesional",
    estado: r.estado,
  }));

  const evaluacionesData: ReportesData["evaluaciones"] = rowsEval.map((e) => ({
    fecha: e.fechaAtencion ? isoFecha(e.fechaAtencion) : "Sin fecha",
    trabajador: e.trabajadorNombreHistorico,
    tipo: e.motivoConsulta ?? "No especificado",
    empresa: e.empresaNombreHistorico,
    estado: e.estado,
  }));

  const fichasData: ReportesData["fichas"] = rowsFich.map((f) => ({
    fecha: f.fechaAtencion ? isoFecha(f.fechaAtencion) : "Sin fecha",
    trabajador: `${f.trabajador.apellidos} ${f.trabajador.nombres}`,
    tipoEvaluacion: f.tipoEvaluacion,
    empresa: f.empresaNombreHistorico ?? "Sin empresa",
    estado: f.estado,
  }));

  const recetasData: ReportesData["recetas"] = rowsRec.map((r) => ({
    fecha: isoFecha(r.fechaEmision),
    paciente: r.trabajadorNombreHistorico,
    medicamentos: r._count.medicamentos,
    medico: r.profesionalNombreHistorico,
    estado: r.estado,
  }));

  const citasData: ReportesData["citas"] = rowsCit.map((c) => ({
    fecha: isoFecha(c.fecha),
    paciente: `${c.trabajador.apellidos} ${c.trabajador.nombres}`,
    motivo: c.motivo,
    profesional: c.profesional
      ? `${c.profesional.apellidos} ${c.profesional.nombres}`
      : "Sin asignar",
    estado: c.estado,
  }));

  const trabajadoresData: ReportesData["trabajadores"] = [];

  const empresas: ReportesData["empresas"] = await Promise.all(
    emp.map(async (e) => {
      const [trabajadores, evals, fichasEmp, citasEmp] = await Promise.all([
        prisma.trabajador.count({
          where: {
            empresaId: e.id,
            estadoLaboral: "ACTIVO",
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
            ...(filtros.departamentoId
              ? { departamentoId: filtros.departamentoId }
              : {}),
            ...(filtros.trabajadorId ? { id: filtros.trabajadorId } : {}),
            ...(filtros.fechaDesde || filtros.fechaHasta
              ? {
                  creadoEn: {
                    ...(filtros.fechaDesde
                      ? {
                          gte: new Date(
                            `${filtros.fechaDesde}T00:00:00.000Z`,
                          ),
                        }
                      : {}),
                    ...(filtros.fechaHasta
                      ? {
                          lte: new Date(
                            `${filtros.fechaHasta}T23:59:59.999Z`,
                          ),
                        }
                      : {}),
                  },
                }
              : {}),
          },
        }),
        prisma.evaluacionMedica.count({
          where: {
            empresaId: e.id,
            estado: { not: "ANULADA" },
            ...(filtros.fechaDesde || filtros.fechaHasta
              ? construirDonde(filtros, "fechaAtencion", usuarioId)
              : {}),
          },
        }),
        prisma.fichaOcupacional.count({
          where: {
            empresaId: e.id,
            estado: { not: "ANULADA" },
            ...(filtros.fechaDesde || filtros.fechaHasta
              ? construirDonde(filtros, "fechaAtencion", usuarioId)
              : {}),
          },
        }),
        prisma.citaMedica.count({
          where: {
            empresaId: e.id,
            ...(filtros.fechaDesde || filtros.fechaHasta
              ? construirDonde(filtros, "fecha", usuarioId)
              : {}),
          },
        }),
      ]);
      return {
        empresaId: e.id,
        empresa: e.razonSocial,
        trabajadores,
        evaluaciones: evals,
        fichas: fichasEmp,
        citas: citasEmp,
      };
    }),
  );

  const gRegistrosDiaArr = gRegistrosDia as unknown as Array<{
    diaAtencion: Date;
    _count: { id: number };
  }>;
  const gEvaluacionesDiaArr = gEvaluacionesDia as unknown as Array<{
    fechaAtencion: Date;
    _count: { id: number };
  }>;
  const gEmpArr = gEmp as unknown as Array<{
    empresaNombreHistorico: string;
    _count: { id: number };
  }>;
  const gDepArr = gDep as unknown as Array<{
    departamentoNombreHistorico: string | null;
    _count: { id: number };
  }>;
  const gFichasDiaArr = gFichasDia as unknown as Array<{
    fechaAtencion: Date;
    _count: { id: number };
  }>;
  const gTipoFichaArr = gTipoFicha as unknown as Array<{
    tipoEvaluacion: string;
    _count: { id: number };
  }>;
  const gEstCitaArr = gEstCita as unknown as Array<{
    estado: string;
    _count: { id: number };
  }>;
  const gEstRecArr = gEstRec as unknown as Array<{
    estado: string;
    _count: { id: number };
  }>;

  const registrosDiariosPorDia: DatosGraficoBarras[] = gRegistrosDiaArr.map(
    (registro) => ({
      label: isoFecha(registro.diaAtencion),
      valor: registro._count.id,
    }),
  );
  const fichasPorDia: DatosGraficoBarras[] = gFichasDiaArr.map((ficha) => ({
    label: isoFecha(ficha.fechaAtencion),
    valor: ficha._count.id,
  }));
  const evaluacionesPorDia: DatosGraficoBarras[] = gEvaluacionesDiaArr.map(
    (evaluacion) => ({
      label: isoFecha(evaluacion.fechaAtencion),
      valor: evaluacion._count.id,
    }),
  );
  const documentosPorEmpresa: DatosGraficoBarras[] = gEmpArr.map((d) => ({
    label: d.empresaNombreHistorico,
    valor: d._count.id,
  }));
  const trabajadoresPorDepartamento: DatosGraficoBarras[] = gDepArr
    .filter((d) => d.departamentoNombreHistorico)
    .map((d) => ({
      label: d.departamentoNombreHistorico!,
      valor: d._count.id,
    }));
  const distribucionFichas: DatosGraficoDonut[] = gTipoFichaArr.map((f, i) => ({
    nombre: f.tipoEvaluacion,
    valor: f._count.id,
    color: COLORES_PALETA[i % COLORES_PALETA.length],
  }));
  const distribucionEstadoCitas: DatosGraficoDonut[] = gEstCitaArr.map(
    (c, i) => ({
      nombre: c.estado,
      valor: c._count.id,
      color: COLORES_PALETA[i % COLORES_PALETA.length],
    }),
  );
  const recetasEstado: DatosGraficoDonut[] = gEstRecArr.map((r, i) => ({
    nombre: r.estado,
    valor: r._count.id,
    color: COLORES_PALETA[i % COLORES_PALETA.length],
  }));
  const diagnosticosFrecuentes = diag;

  const acumuladorMorbilidades = new Map<
    string,
    { nombre: string; cantidad: number }
  >();

  const morbilidadesEvalArr = gMorbilidadesEval as unknown as Array<{
    morbilidad: string | null;
    _count: { id: number };
  }>;
  const morbilidadesRegArr = gMorbilidadesReg as unknown as Array<{
    atencionMorbilidad: string;
    _count: { id: number };
  }>;

  for (const item of morbilidadesEvalArr) {
    const raw = item.morbilidad?.trim();
    if (!raw) continue;
    const normalizado = normalizarMorbilidad(raw);
    if (!normalizado) continue;
    const count = item._count.id;
    const existente = acumuladorMorbilidades.get(normalizado);
    if (existente) {
      existente.cantidad += count;
    } else {
      acumuladorMorbilidades.set(normalizado, { nombre: raw, cantidad: count });
    }
  }

  for (const item of morbilidadesRegArr) {
    const raw = item.atencionMorbilidad?.trim();
    if (!raw) continue;
    const normalizado = normalizarMorbilidad(raw);
    if (!normalizado) continue;
    const count = item._count.id;
    const existente = acumuladorMorbilidades.get(normalizado);
    if (existente) {
      existente.cantidad += count;
    } else {
      acumuladorMorbilidades.set(normalizado, { nombre: raw, cantidad: count });
    }
  }

  const morbilidadesOrdenadas = Array.from(
    acumuladorMorbilidades.values(),
  ).sort((a, b) => {
    if (b.cantidad !== a.cantidad) {
      return b.cantidad - a.cantidad;
    }
    return a.nombre.localeCompare(b.nombre, "es");
  });

  const morbilidadesFrecuentes: DatosGraficoBarras[] = morbilidadesOrdenadas
    .slice(0, 10)
    .map((m) => ({
      label: m.nombre,
      valor: m.cantidad,
    }));

  return {
    resumen: {
      atencionesDiarias: cntReg,
      evaluacionesMedicas: cntEval,
      fichasOcupacionales: cntFich,
      recetasEmitidas: cntRec,
    },
    diarios,
    semanales: [],
    mensuales: [],
    evaluaciones: evaluacionesData,
    fichas: fichasData,
    recetas: recetasData,
    citas: citasData,
    trabajadores: trabajadoresData,
    empresas,
    registrosDiariosPorDia,
    fichasPorDia,
    evaluacionesPorDia,
    documentosPorEmpresa,
    trabajadoresPorDepartamento,
    distribucionFichas,
    distribucionEstadoCitas,
    recetasEstado,
    diagnosticosFrecuentes,
    morbilidadesFrecuentes,
    medicamentosEntregados,
  };
}
