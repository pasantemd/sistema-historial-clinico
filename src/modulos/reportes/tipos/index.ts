export type PeriodoReporte = "semanal" | "mensual" | "personalizado";

export interface FiltrosReportes {
  periodo?: PeriodoReporte;
  fechaReferencia?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  empresaId?: string;
  departamentoId?: string;
  trabajadorId?: string;
  profesionalId?: string;
  estado?: string;
}

export interface ResumenReportes {
  atencionesDiarias: number;
  evaluacionesMedicas: number;
  fichasOcupacionales: number;
  recetasEmitidas: number;
}

export interface ReporteDiario {
  fecha: string;
  trabajador: string;
  documento: string;
  empresa: string;
  atencion: string;
  profesional: string;
  estado: string;
}

export interface ReporteSemanal {
  semanaInicio: string;
  semanaFin: string;
  atenciones: number;
  evaluaciones: number;
  recetas: number;
  citas: number;
}

export interface ReporteMensual {
  anio: number;
  mes: number;
  atenciones: number;
  evaluaciones: number;
  fichas: number;
  recetas: number;
}

export interface ReporteEvaluacion {
  fecha: string;
  trabajador: string;
  tipo: string;
  empresa: string;
  estado: string;
}

export interface ReporteFicha {
  fecha: string;
  trabajador: string;
  tipoEvaluacion: string;
  empresa: string;
  estado: string;
}

export interface ReporteReceta {
  fecha: string;
  paciente: string;
  medicamentos: number;
  medico: string;
  estado: string;
}

export interface ReporteCita {
  fecha: string;
  paciente: string;
  motivo: string;
  profesional: string;
  estado: string;
}

export interface ReporteTrabajador {
  nombre: string;
  documento: string;
  empresa: string;
  departamento: string;
  registros: number;
  estado: string;
}

export interface ReporteEmpresa {
  empresaId: string;
  empresa: string;
  trabajadores: number;
  evaluaciones: number;
  fichas: number;
  citas: number;
}

export interface DatosGraficoBarras {
  label: string;
  valor: number;
  unidad?: string;
}

export interface DatosDiagnosticoFrecuente {
  codigo: string;
  descripcion: string;
  valor: number;
}

export interface DatosGraficoDonut {
  nombre: string;
  valor: number;
  color: string;
}

export interface MedicamentoEntregadoReporte {
  medicamentoId: string;
  nombre: string;
  unidad: string;
  cantidadTotal: number;
  numeroEntregas: number;
}

export interface ReportesData {
  resumen: ResumenReportes;
  diarios: ReporteDiario[];
  semanales: ReporteSemanal[];
  mensuales: ReporteMensual[];
  evaluaciones: ReporteEvaluacion[];
  fichas: ReporteFicha[];
  recetas: ReporteReceta[];
  citas: ReporteCita[];
  trabajadores: ReporteTrabajador[];
  empresas: ReporteEmpresa[];
  registrosDiariosPorDia: DatosGraficoBarras[];
  fichasPorDia: DatosGraficoBarras[];
  evaluacionesPorDia: DatosGraficoBarras[];
  documentosPorEmpresa: DatosGraficoBarras[];
  trabajadoresPorDepartamento: DatosGraficoBarras[];
  distribucionFichas: DatosGraficoDonut[];
  distribucionEstadoCitas: DatosGraficoDonut[];
  recetasEstado: DatosGraficoDonut[];
  diagnosticosFrecuentes: DatosDiagnosticoFrecuente[];
  morbilidadesFrecuentes: DatosGraficoBarras[];
  medicamentosEntregados: MedicamentoEntregadoReporte[];
}
