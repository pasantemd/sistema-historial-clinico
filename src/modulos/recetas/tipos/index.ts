import type { EstadoReceta } from "@/generated/prisma/enums";

export interface RecetaMedicamentoDto {
  id?: string;
  medicamentoId?: string | null;
  nombreMedicamentoHistorico: string;
  nombreGenericoHistorico?: string | null;
  nombreComercialHistorico?: string | null;
  presentacionHistorica: string;
  concentracionHistorica?: string | null;
  cantidad: string;
  dosis: string;
  frecuencia: string;
  intervaloHoras?: number | null;
  duracion: string;
  viaAdministracion: string;
  indicaciones?: string | null;
  observaciones?: string | null;
  orden?: number;
  alertaAlergia?: { sustancia: string; severidad: string; reaccion: string } | null;
}

export interface RecetaResumenDto {
  id: string;
  numeroReceta: string;
  fechaEmision: Date;
  estado: EstadoReceta;
  trabajadorNombreHistorico: string;
  empresaNombreHistorico: string;
  profesionalNombreHistorico: string;
  registroDiarioId: string | null;
  totalMedicamentos: number;
}

export interface PaginaRecetas {
  recetas: RecetaResumenDto[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface RecetaDetalleDto {
  id: string;
  numeroReceta: string;
  fechaEmision: Date;
  estado: EstadoReceta;
  indicacionesGenerales: string | null;
  recomendaciones: string | null;
  observaciones: string | null;
  trabajadorNombreHistorico: string;
  trabajadorDocumentoHistorico: string;
  empresaNombreHistorico: string;
  empresaRucHistorico: string;
  empresaDireccionHistorica: string | null;
  empresaTelefonoHistorico: string | null;
  departamentoNombreHistorico: string | null;
  trabajadorSexoHistorico: string | null;
  trabajadorNacimientoHistorico: Date | null;
  profesionalNombreHistorico: string;
  profesionalCodigoHistorico: string | null;
  profesionalEspecialidadHistorica: string | null;
  diagnosticosHistoricos: unknown;
  alergiaConfirmada: boolean;
  justificacionAlergia: string | null;
  registroDiarioId: string | null;
  evaluacionId: string | null;
  fichaOcupacionalId: string | null;
  documentoClinicoId: string | null;
  medicamentos: RecetaMedicamentoDto[];
}

export interface ContextoRecetaDto {
  trabajador: { id: string; nombre: string; documento: string; fechaNacimiento: string | null; sexo: string };
  empresa: { id: string; nombre: string; ruc: string; direccion: string | null; telefono: string | null } | null;
  departamento: { id: string; nombre: string } | null;
  asignacion: { id: string; empresaId: string; departamentoId: string; empresa: string; departamento: string } | null;
  alergias: Array<{ id: string; sustancia: string; severidad: string; descripcion: string | null }>;
  diagnosticos: Array<{ codigo: string; descripcion: string; def: boolean; pre: boolean }>;
  profesionales: Array<{ id: string; nombre: string; codigoProfesional: string | null; especialidad: string | null }>;
  registroDiarioId: string | null;
  registroDiario: {
    id?: string;
    recetaId?: string | null;
    numeroReceta?: string | null;
    fecha: string;
    morbilidad: string;
    medicacion: string | null;
    procedimiento: string | null;
    profesionalId: string | null;
    medicamentos: Array<{
      nombre: string;
      cantidadEntregada: number;
      unidad: string;
    }>;
  } | null;
  evaluacion: {
    id: string;
    recetaId: string | null;
    fecha: string | null;
    profesionalId: string;
    indicaciones: string | null;
    recomendaciones: string | null;
    morbilidad: string | null;
    medicamentos: Array<{
      medicamentoId: string;
      nombreGenerico: string;
      nombreComercial: string | null;
      presentacion: string;
      cantidad: string;
      dosis: string | null;
      frecuencia: string | null;
      duracion: string | null;
      viaAdministracion: string | null;
      indicaciones: string | null;
    }>;
  } | null;
}

export interface ContextoNuevaAtencionDto {
  trabajador: { id: string; nombre: string; documento: string };
  empresa: { id: string; nombre: string; ruc: string; direccion: string | null } | null;
  departamento: { id: string; nombre: string } | null;
  asignacion: { id: string; empresa: string; departamento: string | null } | null;
  profesionales: Array<{ id: string; nombre: string }>;
}
