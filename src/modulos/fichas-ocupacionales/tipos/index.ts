import type {
  AptitudMedicaOcupacional,
  EstadoFichaOcupacional,
  TipoEvaluacionOcupacional,
} from "@/generated/prisma/enums";
import type { EntradaFicha } from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";

export type TipoEvaluacion = TipoEvaluacionOcupacional;
export type EstadoFicha = EstadoFichaOcupacional;
export type AptitudMedica = AptitudMedicaOcupacional;

export interface ExamenReproductivo {
  examen: string;
  tiempo: string;
  resultado: string;
}

export interface SustanciaConsumo {
  sustancia: string;
  tiempoConsumo: string;
  exConsumidor: boolean;
  tiempoAbstinencia: string;
  noConsume: boolean;
}

export interface ActividadJornada {
  descripcion: string;
  factores: FactoresRiesgo;
  otros: OtrosFactoresRiesgo;
}

export interface FactoresRiesgo {
  fisico: string[];
  seguridad: string[];
  quimico: string[];
  biologico: string[];
  ergonomico: string[];
  psicosocial: string[];
}

export interface OtrosFactoresRiesgo {
  fisico?: string;
  seguridad?: string;
  quimico?: string;
  biologico?: string;
  ergonomico?: string;
  psicosocial?: string;
}

export interface AntecedenteLaboral {
  centroTrabajo: string;
  actividades: string;
  trabajoAnterior: boolean;
  trabajoActual: boolean;
  tiempo: string;
  incidente: boolean;
  accidente: boolean;
  enfermedad: boolean;
  calificadoIess: "SI" | "NO" | null;
  fecha: string;
  especificar: string;
  observaciones: string;
}

export interface ActividadExtralaboral {
  tipo: string;
  descripcion: string;
  fecha: string;
}

export interface ResultadoExamen {
  nombre: string;
  fecha: string;
  resultados: string;
}

export interface Diagnostico {
  enfermedadId: string;
  codigo: string;
  descripcion: string;
  pre: boolean;
  def: boolean;
}

export interface Recomendacion {
  descripcion: string;
}

export interface RegionExamenFisico {
  presente: boolean;
  descripcion: string;
}

export type ExamenFisico = Record<string, RegionExamenFisico>;

export interface EmpresaCatalogoFicha {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string | null;
  actividadEconomicaCodigo: string | null;
  actividadEconomicaDescripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
}

export interface CatalogoFicha {
  empresas: EmpresaCatalogoFicha[];
  departamentos: Array<{ id: string; empresaId: string; nombre: string }>;
}

export interface TrabajadorParaFicha {
  id: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  sexo: string;
  fechaNacimiento: string;
  empresaId: string;
  departamentoId: string;
  vinculoLaboralId: string | null;
  tieneOrganizacionActiva: boolean;
}

export interface FichaResumen {
  id: string;
  trabajadorId: string;
  empresaId: string;
  departamentoId: string;
  tipoEvaluacion: TipoEvaluacion;
  estado: EstadoFicha;
  fechaAtencion: string | null;
  aptitudMedica: AptitudMedica | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface FichaDetalle extends FichaResumen {
  empresa: string;
  empresaRuc: string | null;
  departamento: string;
  trabajador: {
    nombres: string;
    apellidos: string;
    numeroDocumento: string;
    sexo: string;
  };
  primerApellido: string | null;
  segundoApellido: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  puestoTrabajoCIUO: string | null;
  profesionalNombres: string | null;
  profesionalCodigoMedico: string | null;
  observacionesAptitud: string | null;
}

export interface CertificadoFicha {
  id: string;
  trabajadorId: string;
  registroDiarioId: string | null;
  estado: EstadoFicha;
  tipoEvaluacion: TipoEvaluacion;
  fechaAtencion: string;
  finalizadoEn: string;
  aptitudMedica: AptitudMedica | null;
  observacionesAptitud: string | null;
  retiroObservacion: string | null;
  profesionalNombres: string | null;
  profesionalCodigoMedico: string | null;
  firmaTrabajadorAcepta: boolean;
  firmaTrabajadorFecha: string;
  empresa: {
    razonSocial: string;
    nombreComercial: string | null;
    ruc: string;
    actividadEconomicaCodigo: string | null;
    actividadEconomicaDescripcion: string | null;
    direccion: string | null;
    telefono: string | null;
    correo: string | null;
  };
  departamento: string;
  trabajador: {
    nombres: string;
    apellidos: string;
    numeroDocumento: string;
    sexo: string;
    fechaNacimiento: string;
  };
  diagnosticos: Diagnostico[];
  recomendaciones: Recomendacion[];
  institucionSistema: string | null;
  ruc: string | null;
  ciiu: string | null;
  establecimiento: string | null;
  numeroFormulario: string | null;
  numeroArchivo: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  puestoTrabajoCIUO: string | null;
}

export interface FichaPdfDto {
  id: string;
  estado: EstadoFicha;
  tipoEvaluacion: TipoEvaluacion;
  fechaAtencion: string;
  trabajador: string;
  numeroDocumento: string;
  empresa: string;
  departamento: string;
  profesional: string | null;
  numeroArchivo: string | null;
  valores: EntradaFicha;
}
