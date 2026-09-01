export interface DiagnosticoEvaluacionDto {
  enfermedadId: string;
  codigo: string;
  descripcion: string;
  pre: boolean;
  def: boolean;
}

export interface MedicamentoEvaluacionDto {
  nombreGenerico: string;
  nombreComercial?: string;
  presentacion: string;
  cantidad?: number;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  viaAdministracion?: string;
  indicaciones?: string;
  alertaAlergiaConfirmada: boolean;
  justificacionAlergia?: string;
  origen?: "REGISTRO_DIARIO" | "EVALUACION";
}

export interface AlergiaDto {
  id: string;
  tipo: "MEDICAMENTO" | "ALIMENTO" | "AMBIENTAL" | "OTRA";
  sustancia: string;
  descripcion: string | null;
  severidad: "LEVE" | "MODERADA" | "GRAVE";
  activa: boolean;
}

export interface EvaluacionResumenDto {
  id: string;
  trabajadorId: string;
  trabajador: string;
  documento: string;
  empresa: string;
  departamento: string;
  fechaAtencion: string | null;
  estado: "BORRADOR" | "FINALIZADA" | "ANULADA";
  profesional: string | null;
}

export interface PaginaEvaluaciones {
  items: EvaluacionResumenDto[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface ContextoEvaluacionDto {
  trabajador: { id: string; nombre: string; documento: string; sexo: string; fechaNacimiento: string | null };
  asignacion: { id: string; empresaId: string; empresa: string; empresaRuc: string; departamentoId: string; departamento: string; fechaInicio: string | null };
  alergias: AlergiaDto[];
  morbilidadesGuardadas?: string[];
}

export interface ContextoEvaluacionDesdeRegistroDto {
  contexto: ContextoEvaluacionDto;
  registro: {
    id: string;
    trabajadorId: string;
    fechaAtencion: string;
    morbilidad: string;
    procedimiento: string | null;
    medico: { id: string | null; nombre: string | null };
    medicamentos: Array<{
      nombre: string;
      cantidadEntregada: number;
      unidad: string;
    }>;
  };
}
